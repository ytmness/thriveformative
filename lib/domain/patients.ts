import { writeAudit } from "@/lib/audit";
import type { StaffSession } from "@/lib/auth/session";
import { contactHash, decryptPhi, encryptPhi, normalizeEmail } from "@/lib/crypto/phi";
import { countrySql, normalizeCountry } from "@/lib/domain/scope";
import { query } from "@/lib/db";
import { DomainError, pageParams } from "@/lib/http";
import { emitWebhook } from "@/lib/webhooks/emit";

export type PatientInput = {
  locationId?: string | null;
  ownerStaffId?: string | null;
  salutation?: string | null;
  firstName: string;
  lastName: string;
  sex?: string | null;
  birthDate?: string | null;
  preferredLanguage?: string | null;
  marketingSourceId?: string | null;
  referredByName?: string | null;
  email?: string | null;
  mobile?: string | null;
  phone?: string | null;
  street?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  postalCode?: string | null;
  consentSms?: boolean;
  consentEmail?: boolean;
  consentPhone?: boolean;
  consentPostal?: boolean;
  privacyPolicyStatus?: string | null;
  tagIds?: string[];
  customFields?: { fieldId: string; value: unknown }[];
};

const SEX = new Set(["masculino", "femenino", "otro"]);
const PRIVACY = new Set(["sin_respuesta", "aceptado", "rechazado"]);

function mapPatient(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    clientCode: row.client_code,
    locationId: row.location_id,
    ownerStaffId: row.owner_staff_id,
    salutation: row.salutation,
    firstName: row.first_name,
    lastName: row.last_name,
    sex: row.sex,
    birthDate: row.birth_date,
    preferredLanguage: row.preferred_language,
    marketingSourceId: row.marketing_source_id,
    marketingSource: row.marketing_source ?? null,
    referredByName: row.referred_by_name,
    email: decryptPhi(row.email_enc as Buffer | null),
    mobile: decryptPhi(row.mobile_enc as Buffer | null),
    phone: decryptPhi(row.phone_enc as Buffer | null),
    street: row.street,
    city: row.city,
    state: row.state,
    country: row.country,
    postalCode: row.postal_code,
    consentSms: row.consent_sms,
    consentEmail: row.consent_email,
    consentPhone: row.consent_phone,
    consentPostal: row.consent_postal,
    privacyPolicyStatus: row.privacy_policy_status,
    createdBy: row.created_by,
    createdAt: row.created_at,
    tags: row.tags ?? [],
  };
}

function validate(input: PatientInput) {
  if (!input.firstName?.trim() || !input.lastName?.trim()) {
    throw new DomainError("Nombre y apellido son obligatorios.");
  }
  if (input.sex && !SEX.has(input.sex)) throw new DomainError("Sexo no válido.");
  if (input.privacyPolicyStatus && !PRIVACY.has(input.privacyPolicyStatus)) {
    throw new DomainError("Estado del aviso de privacidad no válido.");
  }
  if (input.email && !normalizeEmail(input.email)?.includes("@")) throw new DomainError("Email no válido.");
}

async function saveTags(patientId: string, tagIds?: string[]) {
  if (!tagIds) return;
  await query(`DELETE FROM patient_tags WHERE patient_id = $1`, [patientId]);
  for (const tagId of tagIds) {
    await query(`INSERT INTO patient_tags (patient_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`, [
      patientId,
      tagId,
    ]);
  }
}

async function saveCustom(entityId: string, fields?: { fieldId: string; value: unknown }[]) {
  if (!fields) return;
  for (const field of fields) {
    await query(
      `INSERT INTO custom_field_values (field_id, entity_id, value)
       VALUES ($1, $2, $3::jsonb)
       ON CONFLICT (field_id, entity_id) DO UPDATE SET value = EXCLUDED.value`,
      [field.fieldId, entityId, JSON.stringify(field.value ?? null)]
    );
  }
}

const BASE = `
  SELECT p.*, ms.name AS marketing_source,
         coalesce((
           SELECT json_agg(json_build_object('id', t.id, 'name', t.name, 'color', t.color))
           FROM patient_tags pt JOIN tags t ON t.id = pt.tag_id WHERE pt.patient_id = p.id
         ), '[]'::json) AS tags
  FROM patients p
  LEFT JOIN marketing_sources ms ON ms.id = p.marketing_source_id
`;

export async function listPatients(url: URL) {
  const { page, pageSize, offset } = pageParams(url);
  const q = (url.searchParams.get("q") || "").trim();
  const like = `%${q}%`;
  const filters = [
    q,
    like,
    q ? contactHash("email", q) : null,
    q ? contactHash("phone", q) : null,
    url.searchParams.get("locationId") || null,
    url.searchParams.get("ownerStaffId") || null,
    url.searchParams.get("sex") || null,
    url.searchParams.get("tagId") || null,
    normalizeCountry(url.searchParams.get("country")),
  ];
  const where = `
    WHERE p.deleted_at IS NULL
      AND ($1 = '' OR (p.first_name || ' ' || p.last_name) ILIKE $2 OR p.client_code ILIKE $2
           OR p.email_hash = $3 OR p.mobile_hash = $4 OR p.phone_hash = $4)
      AND ($5::uuid IS NULL OR p.location_id = $5)
      AND ($6::uuid IS NULL OR p.owner_staff_id = $6)
      AND ($7::text IS NULL OR p.sex = $7)
      AND ($8::uuid IS NULL OR EXISTS (
        SELECT 1 FROM patient_tags pt WHERE pt.patient_id = p.id AND pt.tag_id = $8
      ))
      AND ${countrySql("p.location_id", "$9")}
  `;
  const total = await query<{ n: number }>(`SELECT count(*)::int AS n FROM patients p ${where}`, filters);
  const rows = await query(`${BASE} ${where} ORDER BY p.last_name, p.first_name LIMIT $10 OFFSET $11`, [...filters, pageSize, offset]);
  return { rows: rows.rows.map((row) => mapPatient(row)), total: total.rows[0].n, page, pageSize };
}

export async function getPatient(id: string, actor: StaffSession, meta?: { ip?: string | null; userAgent?: string | null }) {
  const res = await query(`${BASE} WHERE p.id = $1 AND p.deleted_at IS NULL`, [id]);
  if (!res.rows[0]) throw new DomainError("Paciente no encontrado.", 404);
  const custom = await query(
    `SELECT v.field_id, v.value, d.label, d.field_key, d.field_type
     FROM custom_field_values v JOIN custom_field_defs d ON d.id = v.field_id
     WHERE v.entity_id = $1`,
    [id]
  );
  await writeAudit({
    actorType: "staff",
    actorId: actor.staff.id,
    action: "patient.view",
    entityType: "patient",
    entityId: id,
    patientId: id,
    ip: meta?.ip,
    userAgent: meta?.userAgent,
  });
  return { ...mapPatient(res.rows[0]), customFields: custom.rows };
}

export async function createPatient(input: PatientInput, actor: StaffSession | null, meta?: { ip?: string | null; userAgent?: string | null }) {
  validate(input);
  const code = await query<{ code: string }>(
    `SELECT 'TF-' || lpad(nextval('patient_code_seq')::text, 5, '0') AS code`
  );
  const inserted = await query<{ id: string }>(
    `INSERT INTO patients (
       client_code, location_id, owner_staff_id, salutation, first_name, last_name, sex, birth_date,
       preferred_language, marketing_source_id, referred_by_name, email_enc, email_hash, mobile_enc,
       mobile_hash, phone_enc, phone_hash, street, city, state, country, postal_code,
       consent_sms, consent_email, consent_phone, consent_postal, privacy_policy_status, created_by
     ) VALUES (
       $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28
     ) RETURNING id`,
    [
      code.rows[0].code,
      input.locationId ?? null,
      input.ownerStaffId ?? null,
      input.salutation ?? null,
      input.firstName.trim(),
      input.lastName.trim(),
      input.sex ?? null,
      input.birthDate || null,
      input.preferredLanguage || "es",
      input.marketingSourceId ?? null,
      input.referredByName ?? null,
      encryptPhi(input.email),
      contactHash("email", input.email),
      encryptPhi(input.mobile),
      contactHash("phone", input.mobile),
      encryptPhi(input.phone),
      contactHash("phone", input.phone),
      input.street ?? null,
      input.city ?? null,
      input.state ?? null,
      input.country ?? null,
      input.postalCode ?? null,
      Boolean(input.consentSms),
      Boolean(input.consentEmail),
      Boolean(input.consentPhone),
      Boolean(input.consentPostal),
      input.privacyPolicyStatus || "sin_respuesta",
      actor?.staff.id ?? null,
    ]
  );
  const id = inserted.rows[0].id;
  await saveTags(id, input.tagIds);
  await saveCustom(id, input.customFields);
  await emitWebhook("patient.created", { patientId: id });
  await writeAudit({
    actorType: actor ? "staff" : "system",
    actorId: actor?.staff.id ?? null,
    action: "patient.create",
    entityType: "patient",
    entityId: id,
    patientId: id,
    ip: meta?.ip,
    userAgent: meta?.userAgent,
  });
  const row = await query(`${BASE} WHERE p.id = $1`, [id]);
  return mapPatient(row.rows[0]);
}

export async function updatePatient(id: string, input: PatientInput, actor: StaffSession, meta?: { ip?: string | null; userAgent?: string | null }) {
  validate(input);
  const existing = await query(`SELECT id FROM patients WHERE id = $1 AND deleted_at IS NULL`, [id]);
  if (!existing.rows[0]) throw new DomainError("Paciente no encontrado.", 404);
  await query(
    `UPDATE patients SET
       location_id=$2, owner_staff_id=$3, salutation=$4, first_name=$5, last_name=$6, sex=$7, birth_date=$8,
       preferred_language=$9, marketing_source_id=$10, referred_by_name=$11, email_enc=$12, email_hash=$13,
       mobile_enc=$14, mobile_hash=$15, phone_enc=$16, phone_hash=$17, street=$18, city=$19, state=$20,
       country=$21, postal_code=$22, consent_sms=$23, consent_email=$24, consent_phone=$25, consent_postal=$26,
       privacy_policy_status=$27
     WHERE id = $1`,
    [
      id,
      input.locationId ?? null,
      input.ownerStaffId ?? null,
      input.salutation ?? null,
      input.firstName.trim(),
      input.lastName.trim(),
      input.sex ?? null,
      input.birthDate || null,
      input.preferredLanguage || "es",
      input.marketingSourceId ?? null,
      input.referredByName ?? null,
      encryptPhi(input.email),
      contactHash("email", input.email),
      encryptPhi(input.mobile),
      contactHash("phone", input.mobile),
      encryptPhi(input.phone),
      contactHash("phone", input.phone),
      input.street ?? null,
      input.city ?? null,
      input.state ?? null,
      input.country ?? null,
      input.postalCode ?? null,
      Boolean(input.consentSms),
      Boolean(input.consentEmail),
      Boolean(input.consentPhone),
      Boolean(input.consentPostal),
      input.privacyPolicyStatus || "sin_respuesta",
    ]
  );
  await saveTags(id, input.tagIds);
  await saveCustom(id, input.customFields);
  await emitWebhook("patient.updated", { patientId: id });
  await writeAudit({
    actorType: "staff",
    actorId: actor.staff.id,
    action: "patient.update",
    entityType: "patient",
    entityId: id,
    patientId: id,
    ip: meta?.ip,
    userAgent: meta?.userAgent,
  });
  const row = await query(`${BASE} WHERE p.id = $1`, [id]);
  return mapPatient(row.rows[0]);
}

export async function archivePatient(id: string, actor: StaffSession) {
  await query(`UPDATE patients SET deleted_at = now() WHERE id = $1 AND deleted_at IS NULL`, [id]);
  await writeAudit({
    actorType: "staff",
    actorId: actor.staff.id,
    action: "patient.archive",
    entityType: "patient",
    entityId: id,
    patientId: id,
  });
}

const LISTS = {
  allergies: "patient_allergies",
  conditions: "patient_conditions",
  medications: "patient_medications",
} as const;

export async function listSensitive(patientId: string, kind: keyof typeof LISTS, actor: StaffSession, meta?: { ip?: string | null; userAgent?: string | null }) {
  const table = LISTS[kind];
  const rows = await query(
    `SELECT id, value_enc, severity, recorded_by, created_at FROM ${table} WHERE patient_id = $1 ORDER BY created_at DESC`,
    [patientId]
  );
  await writeAudit({
    actorType: "staff",
    actorId: actor.staff.id,
    action: `patient.${kind}.view`,
    entityType: "patient",
    entityId: patientId,
    patientId,
    ip: meta?.ip,
    userAgent: meta?.userAgent,
  });
  return rows.rows.map((row) => ({
    id: row.id,
    value: decryptPhi(row.value_enc as Buffer),
    severity: row.severity ?? null,
    recordedBy: row.recorded_by,
    createdAt: row.created_at,
  }));
}

export async function addSensitive(
  patientId: string,
  kind: keyof typeof LISTS,
  value: string,
  severity: string | null,
  actor: StaffSession
) {
  if (!value.trim()) throw new DomainError("El valor es obligatorio.");
  const table = LISTS[kind];
  const hasSeverity = kind === "allergies";
  const inserted = await query<{ id: string }>(
    hasSeverity
      ? `INSERT INTO ${table} (patient_id, value_enc, severity, recorded_by) VALUES ($1,$2,$3,$4) RETURNING id`
      : `INSERT INTO ${table} (patient_id, value_enc, recorded_by) VALUES ($1,$2,$3) RETURNING id`,
    hasSeverity ? [patientId, encryptPhi(value.trim()), severity, actor.staff.id] : [patientId, encryptPhi(value.trim()), actor.staff.id]
  );
  await writeAudit({
    actorType: "staff",
    actorId: actor.staff.id,
    action: `patient.${kind}.create`,
    entityType: kind,
    entityId: inserted.rows[0].id,
    patientId,
  });
  return { id: inserted.rows[0].id };
}

export async function listNotes(patientId: string, actor: StaffSession, meta?: { ip?: string | null; userAgent?: string | null }) {
  const rows = await query(
    `SELECT n.*, u.first_name, u.last_name
     FROM clinical_notes n LEFT JOIN staff_users u ON u.id = n.author_id
     WHERE n.patient_id = $1 ORDER BY n.created_at DESC`,
    [patientId]
  );
  await writeAudit({
    actorType: "staff",
    actorId: actor.staff.id,
    action: "clinical_notes.view",
    entityType: "patient",
    entityId: patientId,
    patientId,
    ip: meta?.ip,
    userAgent: meta?.userAgent,
  });
  return rows.rows.map((row) => ({
    id: row.id,
    appointmentId: row.appointment_id,
    authorName: `${row.first_name || ""} ${row.last_name || ""}`.trim(),
    noteType: row.note_type,
    parentNoteId: row.parent_note_id,
    subjective: decryptPhi(row.subjective_enc as Buffer | null),
    objective: decryptPhi(row.objective_enc as Buffer | null),
    assessment: decryptPhi(row.assessment_enc as Buffer | null),
    plan: decryptPhi(row.plan_enc as Buffer | null),
    body: decryptPhi(row.body_enc as Buffer | null),
    lockedAt: row.locked_at,
    createdAt: row.created_at,
  }));
}

export async function createNote(
  patientId: string,
  input: {
    appointmentId?: string | null;
    noteType?: string;
    parentNoteId?: string | null;
    subjective?: string | null;
    objective?: string | null;
    assessment?: string | null;
    plan?: string | null;
    body?: string | null;
    lock?: boolean;
  },
  actor: StaffSession
) {
  if (input.parentNoteId) {
    const parent = await query<{ locked_at: string | null }>(`SELECT locked_at FROM clinical_notes WHERE id = $1`, [
      input.parentNoteId,
    ]);
    if (!parent.rows[0]?.locked_at) throw new DomainError("Solo se puede añadir un addendum a una nota firmada.");
  }
  const inserted = await query<{ id: string }>(
    `INSERT INTO clinical_notes (
       patient_id, appointment_id, author_id, note_type, parent_note_id,
       subjective_enc, objective_enc, assessment_enc, plan_enc, body_enc, locked_at, signed_by
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10, CASE WHEN $11 THEN now() ELSE NULL END, CASE WHEN $11 THEN $3 ELSE NULL END)
     RETURNING id`,
    [
      patientId,
      input.appointmentId ?? null,
      actor.staff.id,
      input.parentNoteId ? "addendum" : input.noteType || "soap",
      input.parentNoteId ?? null,
      encryptPhi(input.subjective),
      encryptPhi(input.objective),
      encryptPhi(input.assessment),
      encryptPhi(input.plan),
      encryptPhi(input.body),
      Boolean(input.lock),
    ]
  );
  await writeAudit({
    actorType: "staff",
    actorId: actor.staff.id,
    action: "clinical_notes.create",
    entityType: "clinical_note",
    entityId: inserted.rows[0].id,
    patientId,
  });
  return { id: inserted.rows[0].id };
}

export async function lockNote(id: string, actor: StaffSession) {
  const note = await query<{ patient_id: string; locked_at: string | null }>(
    `SELECT patient_id, locked_at FROM clinical_notes WHERE id = $1`,
    [id]
  );
  if (!note.rows[0]) throw new DomainError("Nota no encontrada.", 404);
  if (note.rows[0].locked_at) throw new DomainError("La nota ya está firmada.");
  await query(`UPDATE clinical_notes SET locked_at = now(), signed_by = $2 WHERE id = $1`, [id, actor.staff.id]);
  await writeAudit({
    actorType: "staff",
    actorId: actor.staff.id,
    action: "clinical_notes.sign",
    entityType: "clinical_note",
    entityId: id,
    patientId: note.rows[0].patient_id,
  });
}
