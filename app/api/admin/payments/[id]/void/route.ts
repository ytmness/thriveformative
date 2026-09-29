import { isSession, requirePermission } from "@/lib/auth/guard";
import { voidPayment } from "@/lib/domain/sales";
import { readJson, toErrorResponse } from "@/lib/http";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await requirePermission("sales.refund");
  if (!isSession(session)) return session;
  try {
    const { id } = await ctx.params;
    const body = await readJson(req);
    await voidPayment(id, String(body.reason || ""), session);
    return Response.json({ ok: true });
  } catch (error) {
    return toErrorResponse(error);
  }
}
