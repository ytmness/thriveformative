import { DomainError } from "@/lib/http";
import type { Completion, ModelMessage, ToolSpec } from "@/lib/assistant/types";
import { createOpenAiBrain } from "@/lib/assistant/providers/openai";

export type Brain = {
  complete(messages: ModelMessage[], tools: ToolSpec[]): Promise<Completion>;
};

/** El proveedor se elige con ASSISTANT_PROVIDER para poder cambiar de modelo sin tocar el panel. */
export function createBrain(): Brain {
  const provider = (process.env.ASSISTANT_PROVIDER || "openai").trim().toLowerCase();
  if (provider === "openai") return createOpenAiBrain();
  throw new DomainError("Ese proveedor del asistente todavía no está conectado.", 503);
}
