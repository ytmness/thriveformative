import { log } from "@/lib/log";

const BASE = "https://public-api.granola.ai/v1";

export type GranolaNoteSummary = {
  id: string;
  title: string;
  createdAt: string | null;
};

export type GranolaNoteParts = {
  summary: string;
  notes: string;
  transcript: string;
};

export type GranolaNote = GranolaNoteSummary & {
  body: string;
  parts: GranolaNoteParts;
};

function apiKey() {
  return process.env.GRANOLA_API_KEY?.trim() || "";
}

export function granolaConfigured() {
  return Boolean(apiKey());
}

async function granolaFetch(path: string, init?: RequestInit) {
  const key = apiKey();
  if (!key) return { configured: false as const, ok: false as const, status: 0, json: null as unknown };
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${key}`,
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) {
    log.warn("granola", "llamada fallida", { status: res.status, path });
  }
  return { configured: true as const, ok: res.ok, status: res.status, json };
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

function pickNotes(json: unknown): unknown[] {
  const record = asRecord(json);
  if (!record) return [];
  if (Array.isArray(record.notes)) return record.notes;
  if (Array.isArray(record.data)) return record.data;
  if (Array.isArray(record.items)) return record.items;
  if (Array.isArray(json)) return json as unknown[];
  return [];
}

function mapSummary(raw: unknown): GranolaNoteSummary | null {
  const row = asRecord(raw);
  if (!row) return null;
  const id = String(row.id || row.note_id || "");
  if (!id) return null;
  return {
    id,
    title: String(row.title || row.name || "Granola"),
    createdAt: row.created_at ? String(row.created_at) : row.createdAt ? String(row.createdAt) : null,
  };
}

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function formatTranscript(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (!Array.isArray(value)) return "";
  return value
    .map((item) => {
      const row = asRecord(item);
      if (!row) return "";
      const speaker = asString(row.speaker || row.speaker_name || row.name) || "Hablante";
      const text = asString(row.text || row.content || row.utterance);
      if (!text) return "";
      return `${speaker}: ${text}`;
    })
    .filter(Boolean)
    .join("\n");
}

function errorCode(json: unknown) {
  const row = asRecord(json);
  if (!row) return "";
  return String(row.code || row.error_code || asRecord(row.error)?.code || "").toUpperCase();
}

export function extractParts(raw: unknown): GranolaNoteParts {
  const row = asRecord(raw);
  if (!row) return { summary: "", notes: "", transcript: "" };
  const summary =
    asString(row.summary_markdown) ||
    asString(row.summary_text) ||
    asString(row.summary) ||
    "";
  const notes =
    asString(row.private_notes_markdown) ||
    asString(row.private_notes) ||
    asString(row.notes_markdown) ||
    asString(row.markdown) ||
    asString(row.content) ||
    asString(row.body) ||
    "";
  const transcript = formatTranscript(row.transcript);
  return { summary, notes, transcript };
}

export function composeGranolaBody(
  parts: GranolaNoteParts,
  include: { summary?: boolean; notes?: boolean; transcript?: boolean } = {}
) {
  const flags = {
    summary: include.summary !== false,
    notes: include.notes !== false,
    transcript: include.transcript !== false,
  };
  return [
    flags.summary && parts.summary ? parts.summary : "",
    flags.notes && parts.notes ? parts.notes : "",
    flags.transcript && parts.transcript ? parts.transcript : "",
  ]
    .filter(Boolean)
    .join("\n\n");
}

async function fetchTranscriptPaged(noteId: string): Promise<string> {
  const lines: string[] = [];
  let cursor: string | null = null;
  for (let page = 0; page < 40; page += 1) {
    const path = cursor
      ? `/notes/${encodeURIComponent(noteId)}/transcript?cursor=${encodeURIComponent(cursor)}`
      : `/notes/${encodeURIComponent(noteId)}/transcript`;
    const result = await granolaFetch(path);
    if (!result.ok || !result.json) break;
    const record = asRecord(result.json);
    const chunk =
      formatTranscript(record?.transcript) ||
      formatTranscript(record?.items) ||
      formatTranscript(record?.data) ||
      formatTranscript(result.json);
    if (chunk) lines.push(chunk);
    const next =
      asString(record?.next_cursor) ||
      asString(record?.cursor) ||
      asString(asRecord(record?.pagination)?.next_cursor) ||
      "";
    if (!next || next === cursor) break;
    cursor = next;
  }
  return lines.filter(Boolean).join("\n");
}

export async function listGranolaNotes(limit = 20): Promise<{ configured: boolean; notes: GranolaNoteSummary[] }> {
  if (!granolaConfigured()) return { configured: false, notes: [] };
  const result = await granolaFetch(`/notes?limit=${limit}`);
  if (!result.configured) return { configured: false, notes: [] };
  const notes = pickNotes(result.json).map(mapSummary).filter((row): row is GranolaNoteSummary => Boolean(row));
  log.info("granola", "notas listadas", { count: notes.length });
  return { configured: true, notes };
}

export async function getGranolaNote(id: string): Promise<{ configured: boolean; note: GranolaNote | null }> {
  if (!granolaConfigured()) return { configured: false, note: null };
  const result = await granolaFetch(`/notes/${encodeURIComponent(id)}?include=transcript`);
  if (!result.configured) return { configured: false, note: null };
  const summary = mapSummary(result.json);
  if (!summary) return { configured: true, note: null };
  const parts = extractParts(result.json);
  const tooLarge = result.status === 413 || errorCode(result.json) === "TRANSCRIPT_TOO_LARGE";
  if ((!result.ok && tooLarge) || (!parts.transcript && tooLarge)) {
    parts.transcript = await fetchTranscriptPaged(id);
  } else if (!parts.transcript && result.ok) {
    // Some payloads omit the embedded transcript even on 200; try dedicated endpoint once.
    const paged = await fetchTranscriptPaged(id);
    if (paged) parts.transcript = paged;
  }
  return {
    configured: true,
    note: {
      ...summary,
      parts,
      body: composeGranolaBody(parts),
    },
  };
}
