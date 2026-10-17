import { createHmac, timingSafeEqual } from "crypto";
import { query } from "@/lib/db";
import {
  renewMembershipBySquareSubscription,
  setMembershipStatusBySquare,
} from "@/lib/domain/memberships";
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

type SquareEvent = {
  type?: string;
  data?: {
    object?: {
      payment?: { id?: string; status?: string; order_id?: string };
      subscription?: { id?: string; status?: string };
      invoice?: {
        id?: string;
        status?: string;
        subscription_id?: string;
      };
    };
  };
};

export async function POST(req: Request) {
  const raw = await req.text();
  if (!signatureOk(raw, req.headers.get("x-square-hmacsha256-signature") || "")) {
    return Response.json({ error: "Firma inválida." }, { status: 401 });
  }
  let event: SquareEvent;
  try {
    event = JSON.parse(raw) as SquareEvent;
  } catch {
    return Response.json({ ok: true });
  }

  try {
    if (event.type?.startsWith("subscription.") || event.type?.startsWith("invoice.")) {
      await handleSubscriptionEvent(event);
      return Response.json({ ok: true });
    }
  } catch (error) {
    log.warn("memberships", "no se pudo procesar el webhook de suscripción", {
      name: error instanceof Error ? error.name : "error",
    });
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

async function handleSubscriptionEvent(event: SquareEvent) {
  const subscriptionId =
    event.data?.object?.subscription?.id ||
    event.data?.object?.invoice?.subscription_id ||
    null;
  if (!subscriptionId) return;

  const status = String(event.data?.object?.subscription?.status || "").toUpperCase();
  if (event.type === "subscription.updated" || event.type === "subscription.created") {
    if (status === "ACTIVE" || status === "PENDING") {
      await renewMembershipBySquareSubscription(subscriptionId);
      return;
    }
    if (status === "PAUSED") {
      await setMembershipStatusBySquare(subscriptionId, "paused");
      return;
    }
    if (status === "CANCELED" || status === "DEACTIVATED") {
      await setMembershipStatusBySquare(subscriptionId, "cancelled");
      return;
    }
  }

  if (
    event.type === "invoice.payment_made" ||
    (event.type === "invoice.updated" && String(event.data?.object?.invoice?.status || "").toUpperCase() === "PAID")
  ) {
    await renewMembershipBySquareSubscription(subscriptionId);
  }
}
