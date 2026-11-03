import { log } from "@/lib/log";

const BASE = "https://public-api.granola.ai/v1";
const MIN_INTERVAL_MS = 220; // stay under sustained 5 req/s

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

let lastRequestAt = 0;
let chain: Promise<void> = Promise.resolve();

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function throttle() {
  const wait = Math.max(0, MIN_INTERVAL_MS - (Date.now() - lastRequestAt));
  if (wait > 0) await sleep(wait);
  lastRequestAt = Date.now();
}

function enqueue<T>(fn: () => Promise<T>): Promise<T> {
  const run = chain.then(fn, fn);
  chain = run.then(
    () => undefined,
    () => undefined
  );
  return run;
}

async function granolaFetch(path: string, init?: RequestInit) {
  const key = apiKey();
  if (!key) return { configured: false as const, ok: false as const, status: 0, json: null as unknown };

  return enqueue(async () => {
    let attempt = 0;
    while (attempt < 5) {
      attempt += 1;
      await throttle();
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
      if (res.status === 429) {
        const retryAfter = Number(res.headers.get("retry-after") || 0);
        const backoff = retryAfter > 0 ? retryAfter * 1000 : Math.min(8000, 400 * 2 ** (attempt - 1));
        log.warn("granola", "rate limit, reintento", { status: 429, path, attempt, backoffMs: backoff });
        await sleep(backoff);
        continue;
      }
      if (!res.ok) {
        // Never log response bodies (PHI: summaries/transcripts).
        log.warn("granola", "llamada fallida", { status: res.status, path, code: errorCode(json) || undefined });
      }
      return { configured: true as const, ok: res.ok, status: res.status, json };
    }
    log.warn("granola", "rate limit agotado", { path });
    return { configured: true as const, ok: false as const, status: 429, json: null as unknown };
  });
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

function speakerLabel(value: unknown): string {
  if (typeof value === "string" && value.trim()) return value.trim();
  const row = asRecord(value);
  if (!row) return "Hablante";
  const label =
    asString(row.diarization_label) ||
    asString(row.name) ||
    asString(row.attribution) ||
    asString(row.source);
  if (label === "me") return "Yo";
  if (label === "them") return "Otro";
  if (label === "microphone") return "Micrófono";
  if (label === "speaker") return "Altavoz";
  return label || "Hablante";
}

function formatTranscript(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (!Array.isArray(value)) return "";
  return value
    .map((item) => {
      const row = asRecord(item);
      if (!row) return "";
      const speaker = speakerLabel(row.speaker || row.speaker_name || row.name);
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

/** Map real Granola Get Note fields (docs.granola.ai). */
export function extractParts(raw: unknown): GranolaNoteParts {
  const row = asRecord(raw);
  if (!row) return { summary: "", notes: "", transcript: "" };
  const summary = asString(row.summary_markdown) || asString(row.summary_text) || "";
  const notes = asString(row.private_notes_markdown) || asString(row.private_notes_text) || "";
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
  const sections: string[] = [];
  if (flags.summary && parts.summary) {
    sections.push(`## Resumen\n\n${parts.summary}`);
  }
  if (flags.notes && parts.notes) {
    sections.push(`## Notas propias\n\n${parts.notes}`);
  }
  if (flags.transcript && parts.transcript) {
    sections.push(`## Transcripción completa\n\n${parts.transcript}`);
  }
  return sections.join("\n\n");
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
    const hasMore = record?.has_more === true || record?.hasMore === true;
    if ((!next || next === cursor) && !hasMore) break;
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
  if (!summary && !result.ok) return { configured: true, note: null };
  if (!summary) return { configured: true, note: null };
  const parts = result.ok ? extractParts(result.json) : { summary: "", notes: "", transcript: "" };
  const tooLarge = result.status === 413 || errorCode(result.json) === "TRANSCRIPT_TOO_LARGE";
  if (tooLarge || (!parts.transcript && result.ok)) {
    const paged = await fetchTranscriptPaged(id);
    if (paged) parts.transcript = paged;
  }
  // When 413, summary/notes may still be in the error payload or absent — refetch without transcript.
  if (tooLarge && (!parts.summary || !parts.notes)) {
    const plain = await granolaFetch(`/notes/${encodeURIComponent(id)}`);
    if (plain.ok) {
      const plainParts = extractParts(plain.json);
      if (!parts.summary) parts.summary = plainParts.summary;
      if (!parts.notes) parts.notes = plainParts.notes;
    }
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
