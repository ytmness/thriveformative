import { isSession, requirePermission } from "@/lib/auth/guard";
import { archiveLead, moveLead, saveLead } from "@/lib/domain/leads";
import { readJson, toErrorResponse } from "@/lib/http";

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await requirePermission("leads.write");
  if (!isSession(session)) return session;
  try {
    const { id } = await ctx.params;
    const body = await readJson(req);
    if (body.action === "move") return Response.json(await moveLead(id, String(body.stageId || ""), session));
    if (body.action === "archive") return Response.json(await archiveLead(id, session));
    return Response.json(await saveLead(id, body, session));
  } catch (error) {
    return toErrorResponse(error);
  }
}
