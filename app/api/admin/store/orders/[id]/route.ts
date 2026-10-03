import { isSession, requirePermission } from "@/lib/auth/guard";
import { readJson, toErrorResponse } from "@/lib/http";
import { getStoreOrder, updateStoreOrderStatus } from "@/lib/store/storeOrders";

export const dynamic = "force-dynamic";

const STATUSES = new Set(["paid", "ready", "completed", "cancelled"]);

export async function GET(_req: Request, context: { params: Promise<{ id: string }> }) {
  const session = await requirePermission("sales.read");
  if (!isSession(session)) return session;
  try {
    const { id } = await context.params;
    const order = await getStoreOrder(id);
    if (!order) return Response.json({ error: "Pedido no encontrado." }, { status: 404 });
    return Response.json({ order });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  const session = await requirePermission("sales.read");
  if (!isSession(session)) return session;
  try {
    const { id } = await context.params;
    const body = (await readJson(req)) as { status?: string };
    if (!body.status || !STATUSES.has(body.status)) {
      return Response.json({ error: "Estado inválido." }, { status: 400 });
    }
    const updated = await updateStoreOrderStatus(id, body.status as "paid" | "ready" | "completed" | "cancelled");
    if (!updated) return Response.json({ error: "Pedido no encontrado." }, { status: 404 });
    return Response.json({ ok: true });
  } catch (error) {
    return toErrorResponse(error);
  }
}
