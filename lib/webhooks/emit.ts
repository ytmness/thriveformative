import { createHmac } from "crypto";
import { query } from "@/lib/db";
import { log } from "@/lib/log";

export async function emitWebhook(event: string, data: Record<string, string | null>) {
  const endpoints = await query<{ id: string; url: string; secret: string; events: string[] }>(
    `SELECT id, url, secret, events FROM webhook_endpoints WHERE is_active`
  );
  for (const endpoint of endpoints.rows) {
    if (endpoint.events?.length && !endpoint.events.includes(event)) continue;
    const payload = { event, data, occurredAt: new Date().toISOString() };
    const inserted = await query<{ id: string }>(
      `INSERT INTO webhook_deliveries (endpoint_id, event, payload, next_retry_at)
       VALUES ($1, $2, $3::jsonb, now()) RETURNING id`,
      [endpoint.id, event, JSON.stringify(payload)]
    );
    await deliverWebhook(inserted.rows[0].id);
  }
}

export async function deliverWebhook(deliveryId: string) {
  const res = await query<{
    id: string;
    url: string;
    secret: string;
    payload: unknown;
    attempts: number;
  }>(
    `SELECT d.id, e.url, e.secret, d.payload, d.attempts
     FROM webhook_deliveries d
     JOIN webhook_endpoints e ON e.id = d.endpoint_id
     WHERE d.id = $1 AND d.status = 'pending'`,
    [deliveryId]
  );
  const row = res.rows[0];
  if (!row) return;
  const body = JSON.stringify(row.payload);
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signature = createHmac("sha256", row.secret).update(`${timestamp}.${body}`).digest("hex");
  let responseStatus = 0;
  try {
    const response = await fetch(row.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Thrive-Timestamp": timestamp,
        "X-Thrive-Signature": signature,
      },
      body,
      signal: AbortSignal.timeout(8000),
    });
    responseStatus = response.status;
    if (response.ok) {
      await query(
        `UPDATE webhook_deliveries SET status = 'delivered', attempts = attempts + 1, response_status = $2 WHERE id = $1`,
        [row.id, responseStatus]
      );
      return;
    }
  } catch (error) {
    log.warn("webhooks", "entrega fallida", { name: error instanceof Error ? error.name : "error" });
  }
  const attempts = row.attempts + 1;
  const failed = attempts >= 6;
  const delayMin = Math.min(60, 2 ** attempts);
  await query(
    `UPDATE webhook_deliveries
     SET attempts = $2, response_status = $3, status = $4,
         next_retry_at = now() + ($5 || ' minutes')::interval
     WHERE id = $1`,
    [row.id, attempts, responseStatus || null, failed ? "failed" : "pending", String(delayMin)]
  );
}

export async function retryWebhooks() {
  const due = await query<{ id: string }>(
    `SELECT id FROM webhook_deliveries
     WHERE status = 'pending' AND (next_retry_at IS NULL OR next_retry_at <= now())
     ORDER BY created_at LIMIT 30`
  );
  for (const row of due.rows) await deliverWebhook(row.id);
  return { retried: due.rows.length };
}
