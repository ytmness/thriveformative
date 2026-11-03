import { isSession, requirePermission } from "@/lib/auth/guard";
import { getReminderSettings, saveReminderSettings } from "@/lib/domain/reminderSettings";
import { readJson, toErrorResponse } from "@/lib/http";

export async function GET() {
  const session = await requirePermission("settings.read");
  if (!isSession(session)) return session;
  try {
    return Response.json(await getReminderSettings());
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function PUT(req: Request) {
  const session = await requirePermission("settings.write");
  if (!isSession(session)) return session;
  try {
    const body = await readJson(req);
    return Response.json(
      await saveReminderSettings({
        messaging: body.messaging as { quietStart?: number; quietEnd?: number; smsProvider?: string } | undefined,
        rules: Array.isArray(body.rules) ? body.rules : undefined,
        templates: Array.isArray(body.templates) ? body.templates : undefined,
      })
    );
  } catch (error) {
    return toErrorResponse(error);
  }
}
