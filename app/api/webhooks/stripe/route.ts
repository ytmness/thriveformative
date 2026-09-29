import { NextResponse } from "next/server";
import { markStripePaid } from "@/lib/domain/sales";
import { getStripe } from "@/lib/payments/stripeClient";
import { log } from "@/lib/log";

export async function POST(req: Request) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!stripe || !secret) return NextResponse.json({ error: "Stripe no configurado" }, { status: 503 });
  const raw = await req.text();
  try {
    const event = stripe.webhooks.constructEvent(raw, req.headers.get("stripe-signature") || "", secret);
    if (event.type === "payment_intent.succeeded") {
      const intent = event.data.object as { id?: string };
      if (intent.id) await markStripePaid(intent.id);
    }
    return NextResponse.json({ received: true });
  } catch (error) {
    log.warn("stripe", "webhook rechazado", { name: error instanceof Error ? error.name : "error" });
    return NextResponse.json({ error: "Firma inválida" }, { status: 400 });
  }
}
