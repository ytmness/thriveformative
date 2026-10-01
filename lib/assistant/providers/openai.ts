import type { Brain } from "@/lib/assistant/brain";
import type { Completion, ModelMessage, ToolCall, ToolSpec } from "@/lib/assistant/types";
import { DomainError } from "@/lib/http";
import { log } from "@/lib/log";

type OpenAiMessage = {
  role: string;
  content: string | null;
  tool_calls?: {
    id: string;
    type: "function";
    function: { name: string; arguments: string };
  }[];
  tool_call_id?: string;
};

function toOpenAi(messages: ModelMessage[]): OpenAiMessage[] {
  return messages.map((message) => {
    if (message.role === "tool") {
      return { role: "tool", content: message.content, tool_call_id: message.toolCallId };
    }
    if (message.role === "assistant" && message.toolCalls?.length) {
      return {
        role: "assistant",
        content: message.content,
        tool_calls: message.toolCalls.map((call) => ({
          id: call.id,
          type: "function" as const,
          function: { name: call.name, arguments: call.arguments },
        })),
      };
    }
    return { role: message.role, content: message.content };
  });
}

function readCalls(value: unknown): ToolCall[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const call = item as { id?: unknown; function?: { name?: unknown; arguments?: unknown } };
    if (typeof call.id !== "string" || typeof call.function?.name !== "string") return [];
    const args = typeof call.function.arguments === "string" ? call.function.arguments : "{}";
    return [{ id: call.id, name: call.function.name, arguments: args }];
  });
}

export function createOpenAiBrain(): Brain {
  return {
    async complete(messages, tools) {
      const key = process.env.ASSISTANT_API_KEY?.trim();
      if (!key) throw new DomainError("El asistente no está configurado en el servidor.", 503);
      const model = process.env.ASSISTANT_MODEL?.trim() || "gpt-4o-mini";
      let response: Response;
      try {
        response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${key}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model,
            temperature: 0.2,
            max_tokens: 900,
            messages: toOpenAi(messages),
            tools: tools.map((tool: ToolSpec) => ({
              type: "function",
              function: {
                name: tool.name,
                description: tool.description,
                parameters: tool.parameters,
              },
            })),
          }),
          signal: AbortSignal.timeout(20000),
        });
      } catch {
        throw new DomainError("El asistente tardó demasiado. Inténtalo de nuevo.", 504);
      }
      if (!response.ok) {
        log.error("assistant", "el proveedor rechazó la consulta", { status: String(response.status) });
        if (response.status === 401) throw new DomainError("La clave del asistente no es válida.", 503);
        if (response.status === 429) throw new DomainError("El asistente está saturado. Inténtalo en un momento.", 503);
        throw new DomainError("El asistente no pudo responder.", 502);
      }
      const payload = (await response.json()) as {
        choices?: { message?: { content?: string | null; tool_calls?: unknown } }[];
      };
      const message = payload.choices?.[0]?.message;
      const content = typeof message?.content === "string" ? message.content : null;
      const completion: Completion = { content, toolCalls: readCalls(message?.tool_calls) };
      return completion;
    },
  };
}
