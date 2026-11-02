import { log } from "@/lib/log";

const BASE = "https://public-api.granola.ai/v1";

export type GranolaNoteSummary = {
  id: string;
  title: string;
  createdAt: string | null;
};

export type GranolaNote = GranolaNoteSummary & {
  body: string;
};

function apiKey() {
  return process.env.GRANOLA_API_KEY?.trim() || "";
}

export function granolaConfigured() {
  return Boolean(apiKey());
}

async function granolaFetch(path: string, init?: RequestInit) {
  const key = apiKey();
  if (!key) return { configured: false as const, ok: false as const, status: 0, json: null };
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

function extractBody(raw: unknown) {
  const row = asRecord(raw);
  if (!row) return "";
  const parts = [row.markdown, row.content, row.body, row.summary, row.transcript]
    .map((value) => (typeof value === "string" ? value.trim() : ""))
    .filter(Boolean);
  return parts.join("\n\n");
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
  return {
    configured: true,
    note: {
      ...summary,
      body: extractBody(result.json),
    },
  };
}
