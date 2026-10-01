import { isSession, requireStaff } from "@/lib/auth/guard";
import { assertAssistantQuota, logAssistant } from "@/lib/assistant/log";
import { confirmAssistant, runAssistant } from "@/lib/assistant/runtime";
import type { AssistantScope } from "@/lib/assistant/types";
import { normalizeCountry } from "@/lib/domain/scope";
import { readJson, requestMeta, toErrorResponse } from "@/lib/http";

export const dynamic = "force-dynamic";

function scopeOf(value: unknown): AssistantScope {
  const body = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  const location = typeof body.locationId === "string" ? body.locationId : "";
  return {
    country: normalizeCountry(typeof body.country === "string" ? body.country : null) || "MX",
    locationId: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(location) ? location : null,
  };
}

function pathnameOf(value: unknown): string {
  const path = typeof value === "string" ? value.replace(/^\/(es|en|ko|it)/, "") : "";
  if (!/^\/admin(\/[a-z0-9/-]*)?$/.test(path)) return "/admin";
  return path.slice(0, 120);
}

function historyOf(value: unknown): { role: "user" | "assistant"; content: string }[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const message = item as { role?: unknown; content?: unknown };
    if ((message.role !== "user" && message.role !== "assistant") || typeof message.content !== "string") return [];
    const content = message.content.trim().slice(0, 2000);
    if (!content) return [];
    const role: "user" | "assistant" = message.role === "assistant" ? "assistant" : "user";
    return [{ role, content }];
  }).slice(-12);
}

export async function POST(req: Request) {
  const session = await requireStaff();
  if (!isSession(session)) return session;
  try {
    const body = await readJson(req);
    const scope = scopeOf(body.scope);
    const meta = requestMeta(req);
    const confirm = body.confirm;
    if (confirm && typeof confirm === "object" && !Array.isArray(confirm)) {
      const action = confirm as { tool?: unknown; args?: unknown };
      const args = action.args && typeof action.args === "object" && !Array.isArray(action.args)
        ? (action.args as Record<string, unknown>)
        : {};
      await assertAssistantQuota(session, "tool");
      const reply = await confirmAssistant({
        tool: typeof action.tool === "string" ? action.tool : "",
        args,
        scope,
        session,
        meta,
      });
      await logAssistant(session, "tool", reply.message, typeof action.tool === "string" ? action.tool : null);
      await logAssistant(session, "assistant", reply.message);
      return Response.json(reply);
    }
    const history = historyOf(body.messages);
    const last = history[history.length - 1];
    if (!last || last.role !== "user") {
      return Response.json({ error: "Escribe una pregunta." }, { status: 400 });
    }
    await assertAssistantQuota(session, "user");
    await logAssistant(session, "user", last.content);
    const reply = await runAssistant({
      history,
      scope,
      pathname: pathnameOf(body.pathname),
      session,
      meta,
    });
    await logAssistant(session, "assistant", reply.message, reply.confirm?.tool || null);
    return Response.json(reply);
  } catch (error) {
    return toErrorResponse(error);
  }
}
