import type { StaffSession } from "@/lib/auth/session";
import { decryptPhi, encryptPhi } from "@/lib/crypto/phi";
import { query } from "@/lib/db";
import { getGranolaNote } from "@/lib/granola/client";
import { DomainError } from "@/lib/http";
import { log } from "@/lib/log";
import { createNote, saveSession } from "@/lib/domain/patients";

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

export async function ingestGranolaEvent(payload: unknown) {
  const root = asRecord(payload);
  const data = asRecord(root?.data) || root;
  if (!data) return { skipped: true };
  const granolaNoteId = String(data.id || data.note_id || "");
  if (!granolaNoteId) return { skipped: true };
  const title = String(data.title || data.name || "Granola");
  const noteDate = data.created_at || data.createdAt || data.note_date || null;
  let body = "";
  const fetched = await getGranolaNote(granolaNoteId);
  if (fetched.note?.body) body = fetched.note.body;
  await query(
    `INSERT INTO granola_notes_inbox (granola_note_id, title, note_date, body_enc)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (granola_note_id) DO UPDATE SET
       title = EXCLUDED.title,
       note_date = coalesce(EXCLUDED.note_date, granola_notes_inbox.note_date),
       body_enc = coalesce(EXCLUDED.body_enc, granola_notes_inbox.body_enc)`,
    [granolaNoteId, title, noteDate ? String(noteDate) : null, encryptPhi(body)]
  );
  log.info("granola", "nota en bandeja", { granolaNoteId });
  return { ok: true, granolaNoteId };
}

export async function listGranolaInbox(unassignedOnly = true) {
  const rows = await query<{
    id: string;
    granola_note_id: string;
    title: string | null;
    note_date: string | null;
    body_enc: Buffer | null;
    assigned_patient_id: string | null;
    assigned_folder_key: string | null;
    assigned_at: string | null;
    created_at: string;
  }>(
    `SELECT id, granola_note_id, title, note_date, body_enc, assigned_patient_id, assigned_folder_key, assigned_at, created_at
     FROM granola_notes_inbox
     ${unassignedOnly ? "WHERE assigned_patient_id IS NULL" : ""}
     ORDER BY created_at DESC
     LIMIT 100`
  );
  return rows.rows.map((row) => ({
    id: row.id,
    granolaNoteId: row.granola_note_id,
    title: row.title,
    noteDate: row.note_date,
    assignedPatientId: row.assigned_patient_id,
    assignedFolderKey: row.assigned_folder_key,
    assignedAt: row.assigned_at,
    createdAt: row.created_at,
  }));
}

export async function assignGranolaNote(
  inboxId: string,
  patientId: string,
  folderKey: string,
  actor: StaffSession
) {
  const row = await query<{
    id: string;
    title: string | null;
    body_enc: Buffer | null;
    note_date: string | null;
  }>(`SELECT id, title, body_enc, note_date FROM granola_notes_inbox WHERE id = $1`, [inboxId]);
  const note = row.rows[0];
  if (!note) throw new DomainError("Nota de Granola no encontrada.", 404);
  const body = decryptPhi(note.body_enc) || "";
  const title = note.title || "Granola";
  if (folderKey === "sesiones") {
    const sessionDate = note.note_date ? String(note.note_date).slice(0, 10) : null;
    await saveSession(patientId, { id: null, title, sessionDate, notes: body, durationSeconds: 0 }, actor);
  } else {
    await createNote(patientId, {
      title,
      body,
      noteType: "free",
      folderKey: folderKey === "prioridades" || folderKey === "desequilibrios" ? folderKey : "plan90",
    }, actor);
  }
  await query(
    `UPDATE granola_notes_inbox
     SET assigned_patient_id = $2, assigned_folder_key = $3, assigned_at = now()
     WHERE id = $1`,
    [inboxId, patientId, folderKey]
  );
  log.info("granola", "nota asignada", { inboxId, folderKey });
  return { ok: true };
}
