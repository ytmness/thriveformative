import { isSession, requirePermission } from "@/lib/auth/guard";
import { assignForm, listTemplates, saveTemplate } from "@/lib/domain/forms";
import { readJson, toErrorResponse } from "@/lib/http";

export async function GET() {
  const session = await requirePermission("forms.read");
  if (!isSession(session)) return session;
  return Response.json({ rows: await listTemplates() });
}

export async function POST(req: Request) {
  const session = await requirePermission("forms.write");
  if (!isSession(session)) return session;
  try {
    const body = await readJson(req);
    if (body.action === "assign") return Response.json(await assignForm(body, session));
    return Response.json(await saveTemplate(body.id ? String(body.id) : null, body, session));
  } catch (error) {
    return toErrorResponse(error);
  }
}
