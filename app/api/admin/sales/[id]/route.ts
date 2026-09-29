import { isSession, requirePermission } from "@/lib/auth/guard";
import { addPayment, getSale, markStripePaid, voidSale } from "@/lib/domain/sales";
import { getStripe } from "@/lib/payments/stripeClient";
import { readJson, toErrorResponse, DomainError } from "@/lib/http";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await requirePermission("sales.read");
  if (!isSession(session)) return session;
  try {
    const { id } = await ctx.params;
    return Response.json({ sale: await getSale(id) });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await requirePermission("sales.write");
  if (!isSession(session)) return session;
  try {
    const { id } = await ctx.params;
    const body = await readJson(req);
    if (body.action === "void") {
      await voidSale(id, String(body.reason || ""), session);
      return Response.json({ sale: await getSale(id) });
    }
    if (body.action === "confirm" && body.paymentIntentId) {
      const stripe = getStripe();
      if (!stripe) throw new DomainError("Stripe no está configurado.", 503);
      const intent = await stripe.paymentIntents.retrieve(String(body.paymentIntentId));
      if (intent.status === "succeeded") await markStripePaid(intent.id);
      return Response.json({ sale: await getSale(id) });
    }
    const stripe = await addPayment(id, String(body.methodKey || "cash"), Number(body.amount), session);
    return Response.json({ stripe, sale: await getSale(id) });
  } catch (error) {
    return toErrorResponse(error);
  }
}
