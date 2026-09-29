import { isSession, requirePermission } from "@/lib/auth/guard";
import { saveLead } from "@/lib/domain/leads";
import { readJson, toErrorResponse } from "@/lib/http";

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await requirePermission("leads.write");
  if (!isSession(session)) return session;
  try {
    const { id } = await ctx.params;
    return Response.json(await saveLead(id, await readJson(req), session));
  } catch (error) {
    return toErrorResponse(error);
  }
}
