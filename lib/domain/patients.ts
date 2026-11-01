import { writeAudit } from "@/lib/audit";
import type { StaffSession } from "@/lib/auth/session";
import { contactHash, decryptPhi, encryptPhi, normalizeEmail } from "@/lib/crypto/phi";
import { countrySql, locationCountrySql, normalizeCountry } from "@/lib/domain/scope";
import { generatePatientIdentifier } from "@/lib/domain/patientIdentifier";
import { query } from "@/lib/db";
import { DomainError, pageParams } from "@/lib/http";
import { emitWebhook } from "@/lib/webhooks/emit";

export type PatientInput = {
  locationId?: string | null;
  ownerStaffId?: string | null;
  salutation?: string | null;
  firstName: string;
  middleName?: string | null;
  lastName: string;
  paternalSurname?: string | null;
  maternalSurname?: string | null;
  sex?: string | null;
  sexDetail?: string | null;
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
  emergencyName?: string | null;
  emergencyPhone?: string | null;
  emergencyRelation?: string | null;
  profilePhotoUrl?: string | null;
  tagIds?: string[];
  customFields?: { fieldId: string; value: unknown }[];
};

const SEX = new Set(["masculino", "femenino", "otro", "prefiere_no"]);
const PRIVACY = new Set(["sin_respuesta", "aceptado", "rechazado"]);

function dateOnly(value: unknown): string | null {
  if (value == null || value === "") return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString().slice(0, 10);
  const match = String(value).match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : String(value);
}

function mapPatient(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    clientCode: row.client_code,
    patientIdentifier: row.patient_identifier,
    locationId: row.location_id,
    ownerStaffId: row.owner_staff_id,
    salutation: row.salutation,
    firstName: row.first_name,
    middleName: row.middle_name,
    lastName: row.last_name,
    paternalSurname: row.paternal_surname,
    maternalSurname: row.maternal_surname,
    sex: row.sex,
    sexDetail: row.sex_detail,
    birthDate: dateOnly(row.birth_date),
    preferredLanguage: row.preferred_language,
    marketingSourceId: row.marketing_source_id,
    marketingSource: row.marketing_source ?? null,
    referredByName: row.referred_by_name,
    email: decryptPhi(row.email_enc as Buffer | null),
    mobile: decryptPhi(row.mobile_enc as Buffer | null),
    phone: decryptPhi(row.phone_enc as Buffer | null),
    street: row.street,
    streetNumber: row.street_number,
    neighborhood: row.neighborhood,
    city: row.city,
    state: row.state,
    country: row.country,
    postalCode: row.postal_code,
    consentSms: row.consent_sms,
    consentEmail: row.consent_email,
    consentPhone: row.consent_phone,
    consentPostal: row.consent_postal,
    privacyPolicyStatus: row.privacy_policy_status,
    emergencyName: decryptPhi(row.emergency_name_enc as Buffer | null),
    emergencyPhone: decryptPhi(row.emergency_phone_enc as Buffer | null),
    emergencyRelation: row.emergency_relation,
    profilePhotoUrl: row.profile_photo_url ?? null,
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

const KNOWN_SEX = `('femenino', 'masculino', 'otro', 'prefiere_no')`;

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
    url.searchParams.get("source") || null,
  ];
  const whereBase = `
    WHERE p.deleted_at IS NULL
      AND ($1 = '' OR (p.first_name || ' ' || p.last_name) ILIKE $2 OR p.client_code ILIKE $2
           OR p.patient_identifier ILIKE $2 OR p.email_hash = $3 OR p.mobile_hash = $4 OR p.phone_hash = $4)
      AND (
        $5::uuid IS NULL
        OR p.location_id = $5
        OR (p.location_id IS NULL AND ${locationCountrySql("coalesce(p.country, 'MX')", "$9")})
      )
      AND ($6::uuid IS NULL OR p.owner_staff_id = $6)
      AND ($8::uuid IS NULL OR EXISTS (
        SELECT 1 FROM patient_tags pt WHERE pt.patient_id = p.id AND pt.tag_id = $8
      ))
      AND (
        $9::text IS NULL
        OR ${countrySql("p.location_id", "$9")}
        OR (p.location_id IS NULL AND ${locationCountrySql("coalesce(p.country, 'MX')", "$9")})
      )
  `;
  const sexSql = `
    AND (
      $7::text IS NULL
      OR ($7 = 'sin_dato' AND lower(btrim(coalesce(p.sex, ''))) NOT IN ${KNOWN_SEX})
      OR ($7 <> 'sin_dato' AND lower(btrim(coalesce(p.sex, ''))) = lower($7))
    )
  `;
  const sourceSql = `
    AND (
      $10::text IS NULL
      OR ($10 = 'sin_fuente' AND p.marketing_source_id IS NULL)
      OR ($10 <> 'sin_fuente' AND p.marketing_source_id::text = $10)
    )
  `;
  const where = `${whereBase} ${sexSql} ${sourceSql}`;
  const [total, sexFacet, sourceFacet] = await Promise.all([
    query<{ n: number }>(`SELECT count(*)::int AS n FROM patients p ${where}`, filters),
    query<{ todos: number; femenino: number; masculino: number; otro: number; sin_dato: number }>(
      `SELECT
         count(*)::int AS todos,
         count(*) FILTER (WHERE lower(btrim(coalesce(p.sex, ''))) = 'femenino')::int AS femenino,
         count(*) FILTER (WHERE lower(btrim(coalesce(p.sex, ''))) = 'masculino')::int AS masculino,
         count(*) FILTER (WHERE lower(btrim(coalesce(p.sex, ''))) = 'otro')::int AS otro,
         count(*) FILTER (WHERE lower(btrim(coalesce(p.sex, ''))) NOT IN ${KNOWN_SEX})::int AS sin_dato
       FROM patients p ${whereBase} ${sourceSql}
       AND ($7::text IS NULL OR $7::text IS NOT NULL)`,
      filters
    ),
    query<{ id: string; name: string; total: number }>(
      `SELECT coalesce(p.marketing_source_id::text, 'sin_fuente') AS id,
              coalesce(ms.name, 'Sin fuente') AS name,
              count(*)::int AS total
       FROM patients p
       LEFT JOIN marketing_sources ms ON ms.id = p.marketing_source_id
       ${whereBase} ${sexSql}
       AND ($10::text IS NULL OR $10::text IS NOT NULL)
       GROUP BY p.marketing_source_id, ms.name
       ORDER BY total DESC, name ASC`,
      filters
    ),
  ]);
  const order = url.searchParams.get("sort") === "recent" ? "p.created_at DESC" : "p.last_name, p.first_name";
  const rows = await query(`${BASE} ${where} ORDER BY ${order} LIMIT $11 OFFSET $12`, [...filters, pageSize, offset]);
  return {
    rows: rows.rows.map((row) => mapPatient(row)),
    total: total.rows[0].n,
    page,
    pageSize,
    facets: {
      sex: sexFacet.rows[0] || { todos: 0, femenino: 0, masculino: 0, otro: 0, sin_dato: 0 },
      sources: sourceFacet.rows,
    },
  };
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
  
  // Generar identificador si tenemos los datos necesarios
  let patientIdentifier: string | null = null;
  if (input.birthDate && input.firstName && (input.paternalSurname || input.lastName)) {
    try {
      const firstName = input.firstName;
      const middleName = input.middleName || null;
      const paternalSurname = input.paternalSurname || input.lastName;
      const maternalSurname = input.maternalSurname || null;
      
      patientIdentifier = generatePatientIdentifier(
        firstName,
        middleName,
        paternalSurname,
        maternalSurname,
        input.birthDate
      );
      
      // Verificar si ya existe este identificador
      const existing = await query<{ id: string }>(
        `SELECT id FROM patients WHERE patient_identifier = $1 AND deleted_at IS NULL`,
        [patientIdentifier]
      );
      
      // Si existe, agregar sufijo basado en el código secuencial
      if (existing.rows.length > 0) {
        const suffix = code.rows[0].code.replace("TF-", "").slice(-2);
        patientIdentifier = `${patientIdentifier.slice(0, 8)}-${suffix}`;
      }
    } catch (err) {
      // Si falla la generación del identificador, continuamos sin él
      // (permitimos crear el paciente y generar el ID más adelante cuando tengamos todos los datos)
      console.warn("No se pudo generar identificador automático:", err);
    }
  }
  
  const inserted = await query<{ id: string }>(
    `INSERT INTO patients (
       client_code, patient_identifier, location_id, owner_staff_id, salutation, first_name, middle_name, 
       last_name, paternal_surname, maternal_surname, sex, birth_date,
       preferred_language, marketing_source_id, referred_by_name, email_enc, email_hash, mobile_enc,
       mobile_hash, phone_enc, phone_hash, street, city, state, country, postal_code,
       consent_sms, consent_email, consent_phone, consent_postal, privacy_policy_status, profile_photo_url, created_by
     ) VALUES (
       $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32,$33
     ) RETURNING id`,
    [
      code.rows[0].code,
      patientIdentifier,
      input.locationId ?? null,
      input.ownerStaffId ?? null,
      input.salutation ?? null,
      input.firstName.trim(),
      input.middleName?.trim() ?? null,
      input.lastName.trim(),
      input.paternalSurname?.trim() ?? null,
      input.maternalSurname?.trim() ?? null,
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
      input.profilePhotoUrl ?? null,
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
       location_id=$2, owner_staff_id=$3, salutation=$4, first_name=$5, middle_name=$6, last_name=$7, 
       paternal_surname=$8, maternal_surname=$9, sex=$10, birth_date=$11,
       preferred_language=$12, marketing_source_id=$13, referred_by_name=$14, email_enc=$15, email_hash=$16,
       mobile_enc=$17, mobile_hash=$18, phone_enc=$19, phone_hash=$20, street=$21, city=$22, state=$23,
       country=$24, postal_code=$25, consent_sms=$26, consent_email=$27, consent_phone=$28, consent_postal=$29,
       privacy_policy_status=$30, profile_photo_url=$31
     WHERE id = $1`,
    [
      id,
      input.locationId ?? null,
      input.ownerStaffId ?? null,
      input.salutation ?? null,
      input.firstName.trim(),
      input.middleName?.trim() ?? null,
      input.lastName.trim(),
      input.paternalSurname?.trim() ?? null,
      input.maternalSurname?.trim() ?? null,
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
      input.profilePhotoUrl ?? null,
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
    kind === "allergies"
      ? `SELECT id, value_enc, severity, recorded_by, created_at FROM ${table} WHERE patient_id = $1 ORDER BY created_at DESC`
      : `SELECT id, value_enc, NULL::text AS severity, recorded_by, created_at FROM ${table} WHERE patient_id = $1 ORDER BY created_at DESC`,
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

export async function removeSensitive(patientId: string, kind: keyof typeof LISTS, rowId: string, actor: StaffSession) {
  if (!rowId) throw new DomainError("Falta el registro.");
  const deleted = await query<{ id: string }>(
    `DELETE FROM ${LISTS[kind]} WHERE id = $1 AND patient_id = $2 RETURNING id`,
    [rowId, patientId]
  );
  if (!deleted.rows[0]) throw new DomainError("No se encontró el registro.", 404);
  await writeAudit({
    actorType: "staff",
    actorId: actor.staff.id,
    action: `patient.${kind}.delete`,
    entityType: kind,
    entityId: rowId,
    patientId,
  });
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
    title: row.title,
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
    id?: string | null;
    appointmentId?: string | null;
    noteType?: string;
    parentNoteId?: string | null;
    subjective?: string | null;
    objective?: string | null;
    assessment?: string | null;
    plan?: string | null;
    body?: string | null;
    title?: string | null;
    lock?: boolean;
  },
  actor: StaffSession
) {
  if (input.id) {
    return await updateNote(patientId, input.id, input, actor);
  }
  if (input.parentNoteId) {
    const parent = await query<{ locked_at: string | null }>(`SELECT locked_at FROM clinical_notes WHERE id = $1`, [
      input.parentNoteId,
    ]);
    if (!parent.rows[0]?.locked_at) throw new DomainError("Solo se puede añadir un addendum a una nota firmada.");
  }
  const inserted = await query<{ id: string }>(
    `INSERT INTO clinical_notes (
       patient_id, appointment_id, author_id, note_type, parent_note_id,
       subjective_enc, objective_enc, assessment_enc, plan_enc, body_enc, title, locked_at, signed_by
     ) VALUES (
       $1::uuid, $2::uuid, $3::uuid, $4::text, $5::uuid,
       $6::bytea, $7::bytea, $8::bytea, $9::bytea, $10::bytea, $11::text,
       CASE WHEN $12::boolean THEN now() ELSE NULL END,
       CASE WHEN $12::boolean THEN $3::uuid ELSE NULL END
     )
     RETURNING id`,
    [
      patientId,
      input.appointmentId ?? null,
      actor.staff.id,
      input.parentNoteId ? "addendum" : input.noteType || "free",
      input.parentNoteId ?? null,
      encryptPhi(input.subjective),
      encryptPhi(input.objective),
      encryptPhi(input.assessment),
      encryptPhi(input.plan),
      encryptPhi(input.body),
      input.title?.trim() || null,
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

export async function updateNote(
  patientId: string,
  noteId: string,
  input: {
    subjective?: string | null;
    objective?: string | null;
    assessment?: string | null;
    plan?: string | null;
    body?: string | null;
    title?: string | null;
    lock?: boolean;
  },
  actor: StaffSession
) {
  const existing = await query<{ patient_id: string; locked_at: string | null }>(
    `SELECT patient_id, locked_at FROM clinical_notes WHERE id = $1`,
    [noteId]
  );
  if (!existing.rows[0]) throw new DomainError("Nota no encontrada.", 404);
  if (existing.rows[0].patient_id !== patientId) throw new DomainError("Nota no pertenece a este paciente.", 403);
  if (existing.rows[0].locked_at) throw new DomainError("No se puede editar una nota firmada.", 403);

  await query(
    `UPDATE clinical_notes SET
       subjective_enc = $2::bytea,
       objective_enc = $3::bytea,
       assessment_enc = $4::bytea,
       plan_enc = $5::bytea,
       body_enc = $6::bytea,
       title = $7::text,
       locked_at = CASE WHEN $8::boolean THEN now() ELSE locked_at END,
       signed_by = CASE WHEN $8::boolean THEN $9::uuid ELSE signed_by END
     WHERE id = $1::uuid`,
    [
      noteId,
      encryptPhi(input.subjective),
      encryptPhi(input.objective),
      encryptPhi(input.assessment),
      encryptPhi(input.plan),
      encryptPhi(input.body),
      input.title?.trim() || null,
      Boolean(input.lock),
      actor.staff.id,
    ]
  );
  await writeAudit({
    actorType: "staff",
    actorId: actor.staff.id,
    action: "clinical_notes.update",
    entityType: "clinical_note",
    entityId: noteId,
    patientId,
  });
  return { id: noteId };
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

export async function deleteNote(patientId: string, noteId: string, actor: StaffSession) {
  const deleted = await query<{ id: string }>(
    `DELETE FROM clinical_notes WHERE id = $1 AND patient_id = $2 RETURNING id`,
    [noteId, patientId]
  );
  if (!deleted.rows[0]) throw new DomainError("Nota no encontrada.", 404);
  await writeAudit({
    actorType: "staff",
    actorId: actor.staff.id,
    action: "clinical_notes.delete",
    entityType: "clinical_note",
    entityId: noteId,
    patientId,
  });
}

export async function listSessions(patientId: string, actor: StaffSession, meta?: { ip?: string | null; userAgent?: string | null }) {
  const rows = await query(
    `SELECT id, title, session_date::text AS session_date, notes_enc, duration_seconds, timer_started, created_at
     FROM patient_sessions WHERE patient_id = $1
     ORDER BY session_date DESC NULLS LAST, created_at DESC`,
    [patientId]
  );
  await writeAudit({
    actorType: "staff",
    actorId: actor.staff.id,
    action: "patient.sessions.view",
    entityType: "patient",
    entityId: patientId,
    patientId,
    ip: meta?.ip,
    userAgent: meta?.userAgent,
  });
  return rows.rows.map((row) => ({
    id: row.id,
    title: row.title,
    sessionDate: row.session_date,
    notes: decryptPhi(row.notes_enc as Buffer | null),
    durationSeconds: Number(row.duration_seconds || 0),
    timerStarted: Boolean(row.timer_started),
    createdAt: row.created_at,
  }));
}

export async function saveSession(
  patientId: string,
  input: {
    id?: string | null;
    title?: string | null;
    sessionDate?: string | null;
    notes?: string | null;
    durationSeconds?: number | null;
    startTimer?: boolean;
  },
  actor: StaffSession
) {
  const title = String(input.title || "").trim();
  if (!title) throw new DomainError("El nombre de la sesión es obligatorio.");
  const date = input.sessionDate && /^\d{4}-\d{2}-\d{2}$/.test(input.sessionDate) ? input.sessionDate : null;
  const duration = Math.max(0, Math.min(18 * 3600, Math.round(Number(input.durationSeconds || 0))));
  const startTimer = Boolean(input.startTimer);
  if (input.id) {
    const updated = await query<{ id: string; duration_seconds: number; timer_started: boolean; session_date: string }>(
      `UPDATE patient_sessions SET
         title = $3,
         notes_enc = $4,
         session_date = COALESCE(session_date, $5::date, CURRENT_DATE),
         duration_seconds = GREATEST(duration_seconds, $6),
         timer_started = timer_started OR $7
       WHERE id = $1 AND patient_id = $2
       RETURNING id, duration_seconds, timer_started, session_date::text AS session_date`,
      [input.id, patientId, title, encryptPhi(input.notes), date, duration, startTimer]
    );
    if (!updated.rows[0]) throw new DomainError("Sesión no encontrada.", 404);
    return {
      id: updated.rows[0].id,
      durationSeconds: Number(updated.rows[0].duration_seconds || 0),
      timerStarted: Boolean(updated.rows[0].timer_started),
      sessionDate: updated.rows[0].session_date,
    };
  }
  const inserted = await query<{ id: string; session_date: string }>(
    `INSERT INTO patient_sessions (patient_id, title, session_date, notes_enc, recorded_by)
     VALUES ($1,$2, COALESCE($3::date, CURRENT_DATE), $4, $5) RETURNING id, session_date::text AS session_date`,
    [patientId, title, date, encryptPhi(input.notes), actor.staff.id]
  );
  await writeAudit({
    actorType: "staff",
    actorId: actor.staff.id,
    action: "patient.sessions.create",
    entityType: "session",
    entityId: inserted.rows[0].id,
    patientId,
  });
  return { id: inserted.rows[0].id };
}

export async function deleteSession(patientId: string, sessionId: string, actor: StaffSession) {
  const deleted = await query<{ id: string }>(
    `DELETE FROM patient_sessions WHERE id = $1 AND patient_id = $2 RETURNING id`,
    [sessionId, patientId]
  );
  if (!deleted.rows[0]) throw new DomainError("Sesión no encontrada.", 404);
  await writeAudit({
    actorType: "staff",
    actorId: actor.staff.id,
    action: "patient.sessions.delete",
    entityType: "session",
    entityId: sessionId,
    patientId,
  });
}
