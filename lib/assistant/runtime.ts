import type { StaffSession } from "@/lib/auth/session";
import { createBrain } from "@/lib/assistant/brain";
import { manualText, screenHint } from "@/lib/assistant/manual";
import type { AssistantReply, AssistantScope, DisplayBlock, ModelMessage } from "@/lib/assistant/types";
import { specsOf, toolByName, toolsFor, type ToolContext } from "@/lib/assistant/tools";
import { DomainError } from "@/lib/http";

const TURNS = 4;

type HistoryItem = { role: "user" | "assistant"; content: string };

function systemPrompt(pathname: string, scope: AssistantScope): string {
  const place = scope.locationId ? `sede ${scope.locationId}` : "todas las sedes";
  return [
    "Eres el asistente del panel de Thrive Formative. Respondes en español, breve y concreto.",
    "Si preguntan cómo hacer algo, usa el manual y enlaza la pantalla con markdown [Nombre](/admin/...).",
    "Para cifras o listas, llama una herramienta. No inventes números, nombres ni ids.",
    "Para crear o asignar, reúne los datos obligatorios. Si falta algo, pregúntalo. Cuando los tengas, llama la herramienta de escritura: eso solo propone una tarjeta, no guarda.",
    "No cobres, no anules ventas y no hagas notas de crédito.",
    "Las consultas ya vienen filtradas por el país y la sede del panel.",
    `${screenHint(pathname)} País: ${scope.country || "todos"}. Alcance: ${place}.`,
    "",
    "Manual del panel:",
    manualText(),
  ].join("\n");
}

function parseArgs(raw: string): Record<string, unknown> {
  try {
    const value = JSON.parse(raw) as unknown;
    if (!value || typeof value !== "object" || Array.isArray(value)) return {};
    return value as Record<string, unknown>;
  } catch {
    return {};
  }
}

function failure(error: unknown): string {
  if (error instanceof DomainError) return error.message;
  return "No se pudo completar la consulta.";
}

export async function runAssistant(input: {
  history: HistoryItem[];
  scope: AssistantScope;
  pathname: string;
  session: StaffSession;
  meta?: ToolContext["meta"];
}): Promise<AssistantReply> {
  const tools = toolsFor(input.session);
  const ctx: ToolContext = { session: input.session, scope: input.scope, meta: input.meta };
  const messages: ModelMessage[] = [
    { role: "system", content: systemPrompt(input.pathname, input.scope) },
    ...input.history.map((item) => ({ role: item.role, content: item.content })),
  ];
  const displays: DisplayBlock[] = [];
  const brain = createBrain();

  for (let turn = 0; turn < TURNS; turn++) {
    const completion = await brain.complete(messages, specsOf(tools));
    if (!completion.toolCalls.length) {
      return { message: completion.content?.trim() || "No tengo una respuesta para eso.", blocks: displays, confirm: null };
    }
    messages.push({ role: "assistant", content: completion.content, toolCalls: completion.toolCalls });
    let proposal: AssistantReply | null = null;
    for (const call of completion.toolCalls) {
      const tool = tools.find((item) => item.name === call.name);
      if (!tool) {
        messages.push({ role: "tool", toolCallId: call.id, content: JSON.stringify({ error: "Esa herramienta no está disponible." }) });
        continue;
      }
      const args = tool.normalize ? tool.normalize(parseArgs(call.arguments), ctx) : parseArgs(call.arguments);
      const problem = tool.ready?.(args) || null;
      if (problem) {
        messages.push({ role: "tool", toolCallId: call.id, content: JSON.stringify({ error: `${problem} Pídeselo al usuario antes de continuar.` }) });
        continue;
      }
      if (tool.confirm) {
        proposal = {
          message: completion.content?.trim() || "Revisa los datos y confirma para guardarlo.",
          blocks: displays,
          confirm: {
            tool: tool.name,
            title: tool.title || "Confirmar",
            summary: tool.summary?.(args) || "Confirma para guardarlo.",
            args,
            fields: tool.fields || [],
          },
        };
        messages.push({ role: "tool", toolCallId: call.id, content: JSON.stringify({ pendiente: "Esperando confirmación del usuario." }) });
        continue;
      }
      try {
        const output = await tool.run(args, ctx);
        if (output.displays) displays.push(...output.displays);
        messages.push({ role: "tool", toolCallId: call.id, content: JSON.stringify(output.data).slice(0, 8000) });
      } catch (error) {
        messages.push({ role: "tool", toolCallId: call.id, content: JSON.stringify({ error: failure(error) }) });
      }
    }
    if (proposal) return proposal;
  }
  return { message: "No alcancé a resolverlo. Prueba con una pregunta más concreta.", blocks: displays, confirm: null };
}

export async function confirmAssistant(input: {
  tool: string;
  args: Record<string, unknown>;
  scope: AssistantScope;
  session: StaffSession;
  meta?: ToolContext["meta"];
}): Promise<AssistantReply> {
  const tool = toolByName(input.session, input.tool);
  if (!tool || !tool.confirm) throw new DomainError("Esa acción no está disponible.", 403);
  const ctx: ToolContext = { session: input.session, scope: input.scope, meta: input.meta };
  const args = tool.normalize ? tool.normalize(input.args, ctx) : input.args;
  const problem = tool.ready?.(args) || null;
  if (problem) throw new DomainError(problem);
  const output = await tool.run(args, ctx);
  const saved = output.data && typeof output.data === "object" && "id" in output.data ? "Listo, ya quedó guardado." : "Listo.";
  return { message: saved, blocks: output.displays || [], confirm: null };
}
