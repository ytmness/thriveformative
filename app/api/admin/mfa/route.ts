import { isSession, requireStaff } from "@/lib/auth/guard";
import { beginMfa, confirmMfa } from "@/lib/domain/settings";
import { readJson, toErrorResponse } from "@/lib/http";

export async function POST(req: Request) {
  const session = await requireStaff();
  if (!isSession(session)) return session;
  try {
    const body = await readJson(req);
    if (body.code) return Response.json(await confirmMfa(session, String(body.code)));
    return Response.json(await beginMfa(session));
  } catch (error) {
    return toErrorResponse(error);
  }
}
