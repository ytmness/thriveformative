import { isSession, requirePermission } from "@/lib/auth/guard";
import { updateAppointment } from "@/lib/domain/appointments";
import { readJson, requestMeta, toErrorResponse } from "@/lib/http";

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await requirePermission("appointments.write");
  if (!isSession(session)) return session;
  try {
    const { id } = await ctx.params;
    const appointment = await updateAppointment(id, await readJson(req), session, requestMeta(req));
    return Response.json({ appointment });
  } catch (error) {
    return toErrorResponse(error);
  }
}
