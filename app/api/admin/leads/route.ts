import { isSession, requirePermission } from "@/lib/auth/guard";
import { listLeads, saveLead } from "@/lib/domain/leads";
import { readJson, toErrorResponse } from "@/lib/http";

export async function GET() {
  const session = await requirePermission("leads.read");
  if (!isSession(session)) return session;
  try {
    return Response.json({ rows: await listLeads() });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function POST(req: Request) {
  const session = await requirePermission("leads.write");
  if (!isSession(session)) return session;
  try {
    return Response.json(await saveLead(null, await readJson(req), session));
  } catch (error) {
    return toErrorResponse(error);
  }
}
