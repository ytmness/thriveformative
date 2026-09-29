import { isSession, requirePermission } from "@/lib/auth/guard";
import { addLeadActivity, listLeadActivities } from "@/lib/domain/leads";
import { readJson, toErrorResponse } from "@/lib/http";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await requirePermission("leads.read");
  if (!isSession(session)) return session;
  const { id } = await ctx.params;
  return Response.json({ rows: await listLeadActivities(id) });
}

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await requirePermission("leads.write");
  if (!isSession(session)) return session;
  try {
    const { id } = await ctx.params;
    return Response.json(await addLeadActivity(id, await readJson(req), session));
  } catch (error) {
    return toErrorResponse(error);
  }
}
