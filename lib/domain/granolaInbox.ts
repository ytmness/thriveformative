import type { StaffSession } from "@/lib/auth/session";
import { decryptPhi, encryptPhi } from "@/lib/crypto/phi";
import { query } from "@/lib/db";
import { composeGranolaBody, getGranolaNote, type GranolaNoteParts } from "@/lib/granola/client";
import { DomainError } from "@/lib/http";
import { log } from "@/lib/log";
import { sendClinicEmail } from "@/lib/emailServer";
import { getNotifyEmail } from "@/lib/env/server";
import { createNote, saveSession } from "@/lib/domain/patients";

const TITLE_CODE = /^\s*(TF-\d{5})(?:-S(\d{1,2}))?\b/i;

export type GranolaInclude = {
  summary?: boolean;
  notes?: boolean;
  transcript?: boolean;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

function defaultInclude(include?: GranolaInclude): Required<GranolaInclude> {
  return {
    summary: include?.summary !== false,
    notes: include?.notes !== false,
    transcript: include?.transcript !== false,
  };
}

function partsFromEncrypted(row: {
  summary_enc?: Buffer | null;
  private_notes_enc?: Buffer | null;
  transcript_enc?: Buffer | null;
  body_enc?: Buffer | null;
}): GranolaNoteParts {
  const summary = decryptPhi(row.summary_enc || null) || "";
  const notes = decryptPhi(row.private_notes_enc || null) || "";
  const transcript = decryptPhi(row.transcript_enc || null) || "";
  if (summary || notes || transcript) return { summary, notes, transcript };
  const legacy = decryptPhi(row.body_enc || null) || "";
  return { summary: "", notes: legacy, transcript: "" };
}

async function alertUnassigned(title: string, reason: string, granolaNoteId: string) {
  const inbox = getNotifyEmail();
  await query(
    `INSERT INTO notifications (type, title, body, reference_id)
     VALUES ('granola_unassigned', $1, $2, $3)`,
    ["Granola sin asignar", `${title}: ${reason}`, granolaNoteId]
  ).catch(() => undefined);
  if (inbox) {
    await sendClinicEmail(inbox, "Granola sin asignar", `${title}\n${reason}\nNota: ${granolaNoteId}`).catch(() => undefined);
  }
}

async function alreadyImported(patientId: string, granolaNoteId: string, folderKey: string) {
  if (folderKey === "sesiones") {
    const row = await query<{ id: string }>(
      `SELECT id FROM patient_sessions WHERE patient_id = $1 AND granola_note_id = $2 LIMIT 1`,
      [patientId, granolaNoteId]
    );
    return Boolean(row.rows[0]);
  }
  const row = await query<{ id: string }>(
    `SELECT id FROM clinical_notes WHERE patient_id = $1 AND granola_note_id = $2 LIMIT 1`,
    [patientId, granolaNoteId]
  );
  return Boolean(row.rows[0]);
}

async function sessionTitleExists(patientId: string, sessionNumber: number) {
  const title = `Sesión ${sessionNumber}`;
  const row = await query<{ id: string }>(
    `SELECT id FROM patient_sessions WHERE patient_id = $1 AND lower(title) = lower($2) LIMIT 1`,
    [patientId, title]
  );
  return Boolean(row.rows[0]);
}

async function tryAutoAssign(input: {
  inboxId: string;
  granolaNoteId: string;
  title: string;
  noteDate: string | null;
  parts: GranolaNoteParts;
}) {
  const match = TITLE_CODE.exec(input.title || "");
  if (!match) {
    await query(`UPDATE granola_notes_inbox SET unassigned_reason = $2 WHERE id = $1`, [
      input.inboxId,
      "Sin código TF en el título",
    ]);
    return { assigned: false as const, reason: "Sin código TF en el título" };
  }
  const identifier = match[1].toUpperCase();
  const sessionNumber = match[2] ? Number(match[2]) : null;
  // Clinic TF codes live in client_code (e.g. TF-00011). patient_identifier is the
  // internal chart id (e.g. SXRX101097) — do not require that for Granola titles.
  const patient = await query<{ id: string }>(
    `SELECT id FROM patients
     WHERE deleted_at IS NULL
       AND (
         upper(client_code) = $1
         OR upper(coalesce(patient_identifier, '')) = $1
       )
     ORDER BY CASE WHEN upper(client_code) = $1 THEN 0 ELSE 1 END
     LIMIT 1`,
    [identifier]
  );
  const patientId = patient.rows[0]?.id;
  if (!patientId) {
    const reason = `Código ${identifier} no existe`;
    await query(
      `UPDATE granola_notes_inbox
       SET unassigned_reason = $2, matched_identifier = $3, matched_session = $4
       WHERE id = $1`,
      [input.inboxId, reason, identifier, sessionNumber]
    );
    await alertUnassigned(input.title, reason, input.granolaNoteId);
    return { assigned: false as const, reason };
  }

  if (sessionNumber != null) {
    if (await sessionTitleExists(patientId, sessionNumber)) {
      const reason = `Sesión duplicada: Sesión ${sessionNumber} ya existe para ${identifier}`;
      await query(
        `UPDATE granola_notes_inbox
         SET unassigned_reason = $2, matched_identifier = $3, matched_session = $4
         WHERE id = $1`,
        [input.inboxId, reason, identifier, sessionNumber]
      );
      await alertUnassigned(input.title, reason, input.granolaNoteId);
      return { assigned: false as const, reason };
    }
    if (await alreadyImported(patientId, input.granolaNoteId, "sesiones")) {
      await query(
        `UPDATE granola_notes_inbox
         SET assigned_patient_id = $2, assigned_folder_key = 'sesiones', assigned_at = now(),
             unassigned_reason = NULL, matched_identifier = $3, matched_session = $4
         WHERE id = $1`,
        [input.inboxId, patientId, identifier, sessionNumber]
      );
      return { assigned: true as const, patientId, folderKey: "sesiones" };
    }
    const systemActor = {
      staff: { id: "00000000-0000-0000-0000-000000000000", email: "system@thriveformative.com" },
    } as StaffSession;
    // Prefer a real staff user if available for FK.
    const staff = await query<{ id: string; email: string }>(
      `SELECT id, email FROM staff_users WHERE is_active ORDER BY id ASC LIMIT 1`
    );
    const actor = staff.rows[0]
      ? ({ staff: { id: staff.rows[0].id, email: staff.rows[0].email } } as StaffSession)
      : systemActor;
    await saveSession(
      patientId,
      {
        title: `Sesión ${sessionNumber}`,
        sessionDate: input.noteDate ? String(input.noteDate).slice(0, 10) : null,
        notes: composeGranolaBody(input.parts),
        granolaNoteId: input.granolaNoteId,
      },
      actor
    );
    await query(
      `UPDATE granola_notes_inbox
       SET assigned_patient_id = $2, assigned_folder_key = 'sesiones', assigned_at = now(),
           unassigned_reason = NULL, matched_identifier = $3, matched_session = $4
       WHERE id = $1`,
      [input.inboxId, patientId, identifier, sessionNumber]
    );
    return { assigned: true as const, patientId, folderKey: "sesiones" };
  }

  if (await alreadyImported(patientId, input.granolaNoteId, "plan90")) {
    await query(
      `UPDATE granola_notes_inbox
       SET assigned_patient_id = $2, assigned_folder_key = 'plan90', assigned_at = now(),
           unassigned_reason = NULL, matched_identifier = $3, matched_session = NULL
       WHERE id = $1`,
      [input.inboxId, patientId, identifier]
    );
    return { assigned: true as const, patientId, folderKey: "plan90" };
  }

  const staff = await query<{ id: string; email: string }>(
    `SELECT id, email FROM staff_users WHERE is_active ORDER BY id ASC LIMIT 1`
  );
  if (!staff.rows[0]) {
    const reason = "No hay personal activo para auto-asignar";
    await query(`UPDATE granola_notes_inbox SET unassigned_reason = $2, matched_identifier = $3 WHERE id = $1`, [
      input.inboxId,
      reason,
      identifier,
    ]);
    await alertUnassigned(input.title, reason, input.granolaNoteId);
    return { assigned: false as const, reason };
  }
  const actor = { staff: { id: staff.rows[0].id, email: staff.rows[0].email } } as StaffSession;
  await createNote(
    patientId,
    {
      title: input.title,
      body: composeGranolaBody(input.parts),
      noteType: "free",
      folderKey: "plan90",
      granolaNoteId: input.granolaNoteId,
    },
    actor
  );
  await query(
    `UPDATE granola_notes_inbox
     SET assigned_patient_id = $2, assigned_folder_key = 'plan90', assigned_at = now(),
         unassigned_reason = NULL, matched_identifier = $3, matched_session = NULL
     WHERE id = $1`,
    [input.inboxId, patientId, identifier]
  );
  return { assigned: true as const, patientId, folderKey: "plan90" };
}

async function rememberWebhookEvent(eventId: string | null, granolaNoteId: string, eventType: string | null) {
  if (!eventId) return { duplicate: false as const };
  const inserted = await query<{ event_id: string }>(
    `INSERT INTO granola_webhook_events (event_id, granola_note_id, event_type)
     VALUES ($1, $2, $3)
     ON CONFLICT (event_id) DO NOTHING
     RETURNING event_id`,
    [eventId, granolaNoteId, eventType]
  );
  return { duplicate: !inserted.rows[0] };
}

async function upsertInboxFromFetched(input: {
  granolaNoteId: string;
  title: string;
  noteDate: string | null;
  parts: GranolaNoteParts;
}) {
  const body = composeGranolaBody(input.parts);
  const upserted = await query<{ id: string }>(
    `INSERT INTO granola_notes_inbox (
       granola_note_id, title, note_date, body_enc, summary_enc, private_notes_enc, transcript_enc
     ) VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (granola_note_id) DO UPDATE SET
       title = EXCLUDED.title,
       note_date = coalesce(EXCLUDED.note_date, granola_notes_inbox.note_date),
       body_enc = EXCLUDED.body_enc,
       summary_enc = EXCLUDED.summary_enc,
       private_notes_enc = EXCLUDED.private_notes_enc,
       transcript_enc = EXCLUDED.transcript_enc
     RETURNING id`,
    [
      input.granolaNoteId,
      input.title,
      input.noteDate,
      encryptPhi(body),
      encryptPhi(input.parts.summary),
      encryptPhi(input.parts.notes),
      encryptPhi(input.parts.transcript),
    ]
  );
  return upserted.rows[0].id;
}

export async function ingestGranolaEvent(payload: unknown) {
  const root = asRecord(payload);
  if (!root) return { skipped: true };
  // Webhook body is flat: { event_id, event_type, note_id, occurred_at } — no nested title.
  const data = asRecord(root.data) || root;
  const granolaNoteId = String(data.note_id || data.id || "").trim();
  if (!granolaNoteId) return { skipped: true };
  const eventId = String(data.event_id || root.event_id || "").trim() || null;
  const eventType = String(data.event_type || root.event_type || data.type || root.type || "").trim() || null;

  const remembered = await rememberWebhookEvent(eventId, granolaNoteId, eventType);
  if (remembered.duplicate) {
    log.info("granola", "evento duplicado omitido", { eventId, granolaNoteId });
    return { ok: true, granolaNoteId, duplicate: true, assigned: false as const };
  }

  // Get Note can briefly 404 right after note.generated (summary not queryable yet).
  let fetched = await getGranolaNote(granolaNoteId);
  if (fetched.configured && !fetched.note) {
    for (const delayMs of [1500, 3000, 5000]) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      fetched = await getGranolaNote(granolaNoteId);
      if (fetched.note) break;
    }
  }
  if (!fetched.configured) {
    log.warn("granola", "ingest sin API key", { granolaNoteId });
    return { skipped: true, reason: "api_key" };
  }
  if (!fetched.note) {
    // Keep a pending inbox row so "Reintentar asignación" can pick it up once the note is visible.
    const pendingReason =
      "Nota no disponible en API Granola (404). Espera el resumen AI o reintenta; revisa scopes de la API key.";
    const pending = await query<{ id: string }>(
      `INSERT INTO granola_notes_inbox (granola_note_id, title, unassigned_reason)
       VALUES ($1, $2, $3)
       ON CONFLICT (granola_note_id) DO UPDATE SET
         unassigned_reason = COALESCE(granola_notes_inbox.unassigned_reason, EXCLUDED.unassigned_reason)
       RETURNING id`,
      [granolaNoteId, "Granola (pendiente)", pendingReason]
    );
    log.warn("granola", "nota no encontrada en API", { granolaNoteId, inboxId: pending.rows[0]?.id });
    return { ok: true, granolaNoteId, assigned: false as const, reason: pendingReason };
  }

  // Title MUST come from GET /v1/notes/{id}; webhook payload has no title.
  const title = String(fetched.note.title || "").trim() || "Granola";
  const noteDate = fetched.note.createdAt || (data.occurred_at ? String(data.occurred_at) : null);
  const parts = fetched.note.parts;
  const inboxId = await upsertInboxFromFetched({
    granolaNoteId,
    title,
    noteDate,
    parts,
  });

  const alreadyAssigned = await query<{ assigned_patient_id: string | null }>(
    `SELECT assigned_patient_id FROM granola_notes_inbox WHERE id = $1`,
    [inboxId]
  );
  if (alreadyAssigned.rows[0]?.assigned_patient_id) {
    log.info("granola", "nota ya asignada", { granolaNoteId });
    return { ok: true, granolaNoteId, assigned: true as const, alreadyAssigned: true };
  }

  const assigned = await tryAutoAssign({
    inboxId,
    granolaNoteId,
    title,
    noteDate,
    parts,
  });
  log.info("granola", "nota en bandeja", {
    granolaNoteId,
    assigned: assigned.assigned,
    titleMatched: TITLE_CODE.test(title),
  });
  return { ok: true, granolaNoteId, title, ...assigned };
}

/** Re-fetch note from Granola API and retry TF auto-assignment for an inbox row. */
export async function retryGranolaAutoAssign(inboxId: string) {
  const row = await query<{
    id: string;
    granola_note_id: string;
    assigned_patient_id: string | null;
  }>(`SELECT id, granola_note_id, assigned_patient_id FROM granola_notes_inbox WHERE id = $1`, [inboxId]);
  const note = row.rows[0];
  if (!note) throw new DomainError("Nota de Granola no encontrada.", 404);
  if (note.assigned_patient_id) return { ok: true, assigned: true as const, alreadyAssigned: true };

  let fetched = await getGranolaNote(note.granola_note_id);
  if (fetched.configured && !fetched.note) {
    for (const delayMs of [1000, 2500]) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      fetched = await getGranolaNote(note.granola_note_id);
      if (fetched.note) break;
    }
  }
  if (!fetched.configured) throw new DomainError("Conecta Granola en Configuración.", 503);

  if (fetched.note) {
    const title = String(fetched.note.title || "").trim() || "Granola";
    const noteDate = fetched.note.createdAt;
    const parts = fetched.note.parts;
    await upsertInboxFromFetched({
      granolaNoteId: note.granola_note_id,
      title,
      noteDate,
      parts,
    });
    const assigned = await tryAutoAssign({
      inboxId: note.id,
      granolaNoteId: note.granola_note_id,
      title,
      noteDate,
      parts,
    });
    return { ok: true, title, ...assigned };
  }

  // API 404: still try with a stored TF title (prior successful fetch or corrected row).
  const stored = await query<{
    title: string | null;
    note_date: string | null;
    summary_enc: Buffer | null;
    private_notes_enc: Buffer | null;
    transcript_enc: Buffer | null;
    body_enc: Buffer | null;
  }>(
    `SELECT title, note_date, summary_enc, private_notes_enc, transcript_enc, body_enc
     FROM granola_notes_inbox WHERE id = $1`,
    [note.id]
  );
  const row = stored.rows[0];
  const storedTitle = String(row?.title || "").trim();
  if (row && TITLE_CODE.test(storedTitle)) {
    const parts = partsFromEncrypted(row);
    const assigned = await tryAutoAssign({
      inboxId: note.id,
      granolaNoteId: note.granola_note_id,
      title: storedTitle,
      noteDate: row.note_date,
      parts,
    });
    return { ok: true, title: storedTitle, fromStoredTitle: true, ...assigned };
  }

  const reason =
    "Nota no disponible en API Granola (404). Espera el resumen AI o reintenta; revisa scopes de la API key.";
  await query(`UPDATE granola_notes_inbox SET unassigned_reason = $2 WHERE id = $1`, [note.id, reason]);
  throw new DomainError(reason, 404);
}

export async function reprocessUnassignedGranolaNotes(limit = 40) {
  const rows = await query<{ id: string }>(
    `SELECT id FROM granola_notes_inbox
     WHERE assigned_patient_id IS NULL
     ORDER BY created_at DESC
     LIMIT $1`,
    [limit]
  );
  let assigned = 0;
  let failed = 0;
  for (const row of rows.rows) {
    try {
      const result = await retryGranolaAutoAssign(row.id);
      if (result.assigned) assigned += 1;
    } catch {
      failed += 1;
    }
  }
  return { processed: rows.rows.length, assigned, failed };
}

export async function listGranolaInbox(unassignedOnly = true) {
  const rows = await query<{
    id: string;
    granola_note_id: string;
    title: string | null;
    note_date: string | null;
    body_enc: Buffer | null;
    summary_enc: Buffer | null;
    private_notes_enc: Buffer | null;
    transcript_enc: Buffer | null;
    assigned_patient_id: string | null;
    assigned_folder_key: string | null;
    assigned_at: string | null;
    unassigned_reason: string | null;
    matched_identifier: string | null;
    matched_session: number | null;
    created_at: string;
  }>(
    `SELECT id, granola_note_id, title, note_date, body_enc, summary_enc, private_notes_enc, transcript_enc,
            assigned_patient_id, assigned_folder_key, assigned_at, unassigned_reason,
            matched_identifier, matched_session, created_at
     FROM granola_notes_inbox
     ${unassignedOnly ? "WHERE assigned_patient_id IS NULL" : ""}
     ORDER BY created_at DESC
     LIMIT 100`
  );
  return rows.rows.map((row) => {
    const parts = partsFromEncrypted(row);
    return {
      id: row.id,
      granolaNoteId: row.granola_note_id,
      title: row.title,
      noteDate: row.note_date,
      assignedPatientId: row.assigned_patient_id,
      assignedFolderKey: row.assigned_folder_key,
      assignedAt: row.assigned_at,
      unassignedReason: row.unassigned_reason,
      matchedIdentifier: row.matched_identifier,
      matchedSession: row.matched_session,
      hasSummary: Boolean(parts.summary),
      hasNotes: Boolean(parts.notes),
      hasTranscript: Boolean(parts.transcript),
      createdAt: row.created_at,
    };
  });
}

export async function assignGranolaNote(
  inboxId: string,
  patientId: string,
  folderKey: string,
  actor: StaffSession,
  include?: GranolaInclude,
  sessionNumber?: number | null
) {
  const row = await query<{
    id: string;
    granola_note_id: string;
    title: string | null;
    body_enc: Buffer | null;
    summary_enc: Buffer | null;
    private_notes_enc: Buffer | null;
    transcript_enc: Buffer | null;
    note_date: string | null;
    matched_session: number | null;
  }>(
    `SELECT id, granola_note_id, title, body_enc, summary_enc, private_notes_enc, transcript_enc, note_date, matched_session
     FROM granola_notes_inbox WHERE id = $1`,
    [inboxId]
  );
  const note = row.rows[0];
  if (!note) throw new DomainError("Nota de Granola no encontrada.", 404);
  const granolaNoteId = note.granola_note_id;
  const flags = defaultInclude(include);
  const parts = partsFromEncrypted(note);
  const body = composeGranolaBody(parts, flags);
  const key = folderKey === "prioridades" || folderKey === "desequilibrios" || folderKey === "sesiones" ? folderKey : "plan90";
  const sessionN =
    typeof sessionNumber === "number" && Number.isFinite(sessionNumber) && sessionNumber > 0
      ? Math.floor(sessionNumber)
      : note.matched_session && note.matched_session > 0
        ? note.matched_session
        : null;

  if (await alreadyImported(patientId, granolaNoteId, key === "sesiones" ? "sesiones" : "plan90")) {
    throw new DomainError("Esta nota de Granola ya está en el expediente.", 409);
  }

  if (key === "sesiones") {
    if (!sessionN) throw new DomainError("Indica el número de sesión (1–99).");
    if (await sessionTitleExists(patientId, sessionN)) {
      throw new DomainError(`Sesión duplicada: Sesión ${sessionN} ya existe.`, 409);
    }
    const sessionDate = note.note_date ? String(note.note_date).slice(0, 10) : null;
    await saveSession(
      patientId,
      {
        id: null,
        title: `Sesión ${sessionN}`,
        sessionDate,
        notes: body,
        durationSeconds: 0,
        granolaNoteId,
      },
      actor
    );
  } else {
    await createNote(
      patientId,
      {
        title: note.title || "Granola",
        body,
        noteType: "free",
        folderKey: key,
        granolaNoteId,
      },
      actor
    );
  }
  await query(
    `UPDATE granola_notes_inbox
     SET assigned_patient_id = $2, assigned_folder_key = $3, assigned_at = now(),
         unassigned_reason = NULL, matched_session = COALESCE($4, matched_session)
     WHERE id = $1`,
    [inboxId, patientId, key, key === "sesiones" ? sessionN : null]
  );
  log.info("granola", "nota asignada", { inboxId, folderKey: key });
  return { ok: true };
}

export async function importGranolaNoteToPatient(
  granolaNoteId: string,
  patientId: string,
  folderKey: string,
  actor: StaffSession,
  include?: GranolaInclude
) {
  const fetched = await getGranolaNote(granolaNoteId);
  if (!fetched.configured) throw new DomainError("Conecta Granola en Configuración.", 503);
  if (!fetched.note) throw new DomainError("No se encontró la nota de Granola.", 404);
  const key = folderKey === "prioridades" || folderKey === "desequilibrios" || folderKey === "sesiones" ? folderKey : "plan90";
  if (await alreadyImported(patientId, granolaNoteId, key === "sesiones" ? "sesiones" : "plan90")) {
    throw new DomainError("Esta nota de Granola ya está en el expediente.", 409);
  }
  const body = composeGranolaBody(fetched.note.parts, defaultInclude(include));
  if (key === "sesiones") {
    const match = TITLE_CODE.exec(fetched.note.title || "");
    const sessionN = match?.[2] ? Number(match[2]) : null;
    const sessionTitle = sessionN ? `Sesión ${sessionN}` : fetched.note.title;
    if (sessionN && (await sessionTitleExists(patientId, sessionN))) {
      throw new DomainError(`Sesión duplicada: Sesión ${sessionN} ya existe.`, 409);
    }
    await saveSession(
      patientId,
      {
        title: sessionTitle,
        sessionDate: fetched.note.createdAt ? fetched.note.createdAt.slice(0, 10) : null,
        notes: body,
        granolaNoteId,
      },
      actor
    );
  } else {
    await createNote(
      patientId,
      {
        title: fetched.note.title,
        body,
        noteType: "free",
        folderKey: key,
        granolaNoteId,
      },
      actor
    );
  }
  await query(
    `INSERT INTO granola_notes_inbox (
       granola_note_id, title, note_date, body_enc, summary_enc, private_notes_enc, transcript_enc,
       assigned_patient_id, assigned_folder_key, assigned_at
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9, now())
     ON CONFLICT (granola_note_id) DO UPDATE SET
       assigned_patient_id = EXCLUDED.assigned_patient_id,
       assigned_folder_key = EXCLUDED.assigned_folder_key,
       assigned_at = now(),
       unassigned_reason = NULL`,
    [
      granolaNoteId,
      fetched.note.title,
      fetched.note.createdAt,
      encryptPhi(body),
      encryptPhi(fetched.note.parts.summary),
      encryptPhi(fetched.note.parts.notes),
      encryptPhi(fetched.note.parts.transcript),
      patientId,
      key,
    ]
  );
  return { ok: true };
}
