import { isSession, requirePermission } from "@/lib/auth/guard";
import { query } from "@/lib/db";
import { toErrorResponse } from "@/lib/http";

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await requirePermission("appointments.write");
  if (!isSession(session)) return session;
  try {
    const { id } = await ctx.params;
    await query(`DELETE FROM bookouts WHERE id = $1`, [id]);
    return Response.json({ ok: true });
  } catch (error) {
    return toErrorResponse(error);
  }
}
