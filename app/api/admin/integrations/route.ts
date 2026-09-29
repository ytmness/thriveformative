import { createHash, randomBytes } from "crypto";
import { isSession, requirePermission } from "@/lib/auth/guard";
import { query } from "@/lib/db";
import { readJson, toErrorResponse, DomainError } from "@/lib/http";

export async function GET() {
  const session = await requirePermission("api.manage");
  if (!isSession(session)) return session;
  const keys = await query(`SELECT id, name, key_prefix, scopes, last_used_at, revoked_at, created_at FROM api_keys ORDER BY created_at DESC`);
  const hooks = await query(`SELECT id, url, events, is_active, created_at FROM webhook_endpoints ORDER BY created_at DESC`);
  return Response.json({ keys: keys.rows, webhooks: hooks.rows });
}

export async function POST(req: Request) {
  const session = await requirePermission("api.manage");
  if (!isSession(session)) return session;
  try {
    const body = await readJson(req);
    if (body.kind === "webhook") {
      const url = String(body.url || "");
      if (!url.startsWith("https://")) throw new DomainError("El webhook debe usar HTTPS.");
      const secret = randomBytes(24).toString("hex");
      const inserted = await query<{ id: string }>(
        `INSERT INTO webhook_endpoints (url, secret, events) VALUES ($1,$2,$3) RETURNING id`,
        [url, secret, Array.isArray(body.events) ? body.events : ["patient.created", "appointment.created", "appointment.updated", "appointment.cancelled", "lead.created", "sale.created"]]
      );
      return Response.json({ id: inserted.rows[0].id, secret });
    }
    const raw = `tf_${randomBytes(24).toString("base64url")}`;
    const inserted = await query<{ id: string }>(
      `INSERT INTO api_keys (name, key_hash, key_prefix, scopes, created_by) VALUES ($1,$2,$3,$4,$5) RETURNING id`,
      [String(body.name || "API"), createHash("sha256").update(raw).digest("hex"), raw.slice(0, 10), Array.isArray(body.scopes) ? body.scopes : ["patients.read"], session.staff.id]
    );
    return Response.json({ id: inserted.rows[0].id, token: raw });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function DELETE(req: Request) {
  const session = await requirePermission("api.manage");
  if (!isSession(session)) return session;
  const url = new URL(req.url);
  if (url.searchParams.get("webhook")) {
    await query(`UPDATE webhook_endpoints SET is_active = false WHERE id = $1`, [url.searchParams.get("webhook")]);
  } else if (url.searchParams.get("key")) {
    await query(`UPDATE api_keys SET revoked_at = now() WHERE id = $1`, [url.searchParams.get("key")]);
  }
  return Response.json({ ok: true });
}
