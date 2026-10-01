export type AssistantScope = {
  country: string;
  locationId: string | null;
};

export type MetricItem = { label: string; value: string };

export type DisplayBlock =
  | { kind: "metrics"; title: string; items: MetricItem[] }
  | { kind: "table"; title: string; columns: string[]; rows: string[][] }
  | { kind: "links"; items: { href: string; label: string }[] };

export type ConfirmField = {
  key: string;
  label: string;
  input: "text" | "textarea" | "select" | "datetime" | "fields";
  options?: { value: string; label: string }[];
};

export type ConfirmCard = {
  tool: string;
  title: string;
  summary: string;
  args: Record<string, unknown>;
  fields: ConfirmField[];
};

export type AssistantReply = {
  message: string;
  blocks: DisplayBlock[];
  confirm: ConfirmCard | null;
};

export type ToolCall = {
  id: string;
  name: string;
  arguments: string;
};

export type ToolSpec = {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
};

export type ModelMessage =
  | { role: "system" | "user"; content: string }
  | { role: "assistant"; content: string | null; toolCalls?: ToolCall[] }
  | { role: "tool"; toolCallId: string; content: string };

export type Completion = {
  content: string | null;
  toolCalls: ToolCall[];
};
