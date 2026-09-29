import { isSession, requirePermission } from "@/lib/auth/guard";
import { convertLead } from "@/lib/domain/leads";
import { toErrorResponse } from "@/lib/http";

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await requirePermission("leads.write");
  if (!isSession(session)) return session;
  const writePatients = session.permissions.includes("patients.write");
  if (!writePatients) return Response.json({ error: "Sin permiso para crear pacientes" }, { status: 403 });
  try {
    const { id } = await ctx.params;
    return Response.json(await convertLead(id, session));
  } catch (error) {
    return toErrorResponse(error);
  }
}
