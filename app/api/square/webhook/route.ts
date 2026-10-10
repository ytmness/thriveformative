import { createHmac, timingSafeEqual } from "crypto";
import { query } from "@/lib/db";
import { getSiteUrl } from "@/lib/env/server";
import { log } from "@/lib/log";
import { squareFetch } from "@/lib/square/client";
import { deductThriveForSquareVariation } from "@/lib/store/usInventory";

export const dynamic = "force-dynamic";

function signatureOk(raw: string, header: string) {
  const key = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY?.trim();
  if (!key || !header) return false;
  const url = `${getSiteUrl().replace(/\/$/, "")}/api/square/webhook`;
  const digest = createHmac("sha256", key).update(url + raw).digest("base64");
  const left = Buffer.from(digest);
  const right = Buffer.from(header);
  return left.length === right.length && timingSafeEqual(left, right);
}

export async function POST(req: Request) {
  const raw = await req.text();
  if (!signatureOk(raw, req.headers.get("x-square-hmacsha256-signature") || "")) {
    return Response.json({ error: "Firma inválida." }, { status: 401 });
  }
  let event: { type?: string; data?: { object?: { payment?: { id?: string; status?: string; order_id?: string } } } };
  try {
    event = JSON.parse(raw) as typeof event;
  } catch {
    return Response.json({ ok: true });
  }
  const payment = event.data?.object?.payment;
  if (event.type !== "payment.updated" || payment?.status !== "COMPLETED" || !payment.order_id) {
    return Response.json({ ok: true });
  }
  const own = await query(`SELECT 1 FROM store_orders WHERE square_order_id = $1 LIMIT 1`, [payment.order_id]);
  if (own.rows[0]) return Response.json({ ok: true });
  try {
    const body = await squareFetch<{
      order?: { line_items?: { catalog_object_id?: string; quantity?: string }[] };
    }>(`/v2/orders/${encodeURIComponent(payment.order_id)}`);
    for (const line of body.order?.line_items ?? []) {
      if (!line.catalog_object_id) continue;
      const quantity = Math.max(1, Math.round(Number(line.quantity || 1)));
      await deductThriveForSquareVariation(line.catalog_object_id, quantity, `square:${payment.order_id}:${line.catalog_object_id}`);
    }
  } catch {
    log.warn("inventory", "no se pudo descontar una venta llegada desde Square");
  }
  return Response.json({ ok: true });
}
