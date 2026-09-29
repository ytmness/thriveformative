import { writeAudit } from "@/lib/audit";
import type { StaffSession } from "@/lib/auth/session";
import { contactHash, decryptPhi, encryptPhi } from "@/lib/crypto/phi";
import { query } from "@/lib/db";
import { DomainError } from "@/lib/http";
import { createPatient, type PatientInput } from "@/lib/domain/patients";
import { emitWebhook } from "@/lib/webhooks/emit";

function blankNumber(value: unknown) {
  if (value == null || value === "") return null;
  const amount = Number(value);
  if (Number.isNaN(amount)) throw new DomainError("El valor estimado no es un número.");
  return amount;
}

export async function listLeads() {
  const rows = await query(
    `SELECT l.*, s.name AS stage_name, s.is_won, s.is_lost, u.first_name AS owner_first, u.last_name AS owner_last,
            ms.name AS source_name
     FROM leads l
     LEFT JOIN lead_stages s ON s.id = l.stage_id
     LEFT JOIN staff_users u ON u.id = l.owner_staff_id
     LEFT JOIN marketing_sources ms ON ms.id = l.marketing_source_id
     WHERE l.archived_at IS NULL
     ORDER BY l.created_at DESC`
  );
  return rows.rows.map((row) => ({
    ...row,
    email: decryptPhi(row.email_enc as Buffer | null),
    mobile: decryptPhi(row.mobile_enc as Buffer | null),
    phone: decryptPhi(row.phone_enc as Buffer | null),
    email_enc: undefined,
    mobile_enc: undefined,
    phone_enc: undefined,
  }));
}

export async function saveLead(id: string | null, body: Record<string, unknown>, actor: StaffSession) {
  const firstName = String(body.firstName || "").trim();
  const lastName = String(body.lastName || "").trim();
  if (!firstName || !lastName) throw new DomainError("Nombre y apellido son obligatorios.");
  if (!body.stageId) {
    const first = await query<{ id: string }>(`SELECT id FROM lead_stages ORDER BY sort_order, name LIMIT 1`);
    if (first.rows[0]) body.stageId = first.rows[0].id;
  }
  if (!body.stageId) throw new DomainError("La etapa es obligatoria.");
  const values = [
    body.locationId || null,
    body.ownerStaffId || null,
    body.stageId || null,
    body.status || "open",
    body.salutation || null,
    firstName,
    lastName,
    body.sex || null,
    body.birthDate || null,
    body.preferredLanguage || "es",
    body.marketingSourceId || null,
    body.referredByName || null,
    encryptPhi(typeof body.email === "string" ? body.email : null),
    contactHash("email", typeof body.email === "string" ? body.email : null),
    encryptPhi(typeof body.mobile === "string" ? body.mobile : null),
    contactHash("phone", typeof body.mobile === "string" ? body.mobile : null),
    encryptPhi(typeof body.phone === "string" ? body.phone : null),
    body.street || null,
    body.city || null,
    body.state || null,
    body.country || null,
    body.postalCode || null,
    blankNumber(body.estimatedValue),
    body.lostReason || null,
  ];
  if (!id) {
    const inserted = await query<{ id: string }>(
      `INSERT INTO leads (
         location_id, owner_staff_id, stage_id, status, salutation, first_name, last_name, sex, birth_date,
         preferred_language, marketing_source_id, referred_by_name, email_enc, email_hash, mobile_enc, mobile_hash,
         phone_enc, street, city, state, country, postal_code, estimated_value, lost_reason, created_by
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25)
       RETURNING id`,
      [...values, actor.staff.email === "api" ? actor.staff.id || null : actor.staff.id]
    );
    await emitWebhook("lead.created", { leadId: inserted.rows[0].id });
    return { id: inserted.rows[0].id };
  }
  await query(
    `UPDATE leads SET
      location_id=$2, owner_staff_id=$3, stage_id=$4, status=$5, salutation=$6, first_name=$7, last_name=$8,
      sex=$9, birth_date=$10, preferred_language=$11, marketing_source_id=$12, referred_by_name=$13,
      email_enc=$14, email_hash=$15, mobile_enc=$16, mobile_hash=$17, phone_enc=$18, street=$19, city=$20,
      state=$21, country=$22, postal_code=$23, estimated_value=$24, lost_reason=$25,
      won_at = CASE WHEN $5 = 'won' THEN coalesce(won_at, now()) ELSE won_at END,
      lost_at = CASE WHEN $5 = 'lost' THEN coalesce(lost_at, now()) ELSE lost_at END
     WHERE id = $1`,
    [id, ...values]
  );
  await emitWebhook("lead.updated", { leadId: id });
  return { id };
}

export async function moveLead(id: string, stageId: string, actor: StaffSession) {
  if (!stageId) throw new DomainError("La etapa es obligatoria.");
  const updated = await query(`UPDATE leads SET stage_id = $2 WHERE id = $1 AND archived_at IS NULL RETURNING id`, [id, stageId]);
  if (!updated.rows[0]) throw new DomainError("Lead no encontrado.", 404);
  await writeAudit({
    actorType: "staff",
    actorId: actor.staff.id,
    action: "lead.stage",
    entityType: "lead",
    entityId: id,
    metadata: { stageId },
  });
  return { id };
}

export async function archiveLead(id: string, actor: StaffSession) {
  const updated = await query(`UPDATE leads SET archived_at = now() WHERE id = $1 AND archived_at IS NULL RETURNING id`, [id]);
  if (!updated.rows[0]) throw new DomainError("Lead no encontrado.", 404);
  await writeAudit({
    actorType: "staff",
    actorId: actor.staff.id,
    action: "lead.archive",
    entityType: "lead",
    entityId: id,
  });
  return { id };
}

export async function addLeadActivity(leadId: string, body: Record<string, unknown>, actor: StaffSession) {
  const inserted = await query<{ id: string }>(
    `INSERT INTO lead_activities (lead_id, staff_user_id, activity_type, body, due_at, completed_at)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
    [leadId, actor.staff.id, body.activityType || "note", String(body.body || ""), body.dueAt || null, body.completedAt || null]
  );
  return { id: inserted.rows[0].id };
}

export async function listLeadActivities(leadId: string) {
  const rows = await query(
    `SELECT a.*, u.first_name, u.last_name FROM lead_activities a
     LEFT JOIN staff_users u ON u.id = a.staff_user_id WHERE a.lead_id = $1 ORDER BY a.created_at DESC`,
    [leadId]
  );
  return rows.rows;
}

export async function convertLead(leadId: string, actor: StaffSession) {
  const lead = await query(`SELECT * FROM leads WHERE id = $1`, [leadId]);
  const row = lead.rows[0];
  if (!row) throw new DomainError("Lead no encontrado.", 404);
  if (row.converted_patient_id) throw new DomainError("Este lead ya es paciente.");
  const input: PatientInput = {
    locationId: row.location_id,
    ownerStaffId: row.owner_staff_id,
    salutation: row.salutation,
    firstName: row.first_name,
    lastName: row.last_name,
    sex: row.sex,
    birthDate: row.birth_date,
    preferredLanguage: row.preferred_language,
    marketingSourceId: row.marketing_source_id,
    referredByName: row.referred_by_name,
    email: decryptPhi(row.email_enc),
    mobile: decryptPhi(row.mobile_enc),
    phone: decryptPhi(row.phone_enc),
    street: row.street,
    city: row.city,
    state: row.state,
    country: row.country,
    postalCode: row.postal_code,
  };
  const patient = await createPatient(input, actor);
  const won = await query<{ id: string }>(`SELECT id FROM lead_stages WHERE is_won ORDER BY sort_order LIMIT 1`);
  await query(
    `UPDATE leads SET converted_patient_id = $2, status = 'won', won_at = now(), stage_id = coalesce($3, stage_id) WHERE id = $1`,
    [leadId, patient.id, won.rows[0]?.id ?? null]
  );
  await writeAudit({
    actorType: "staff",
    actorId: actor.staff.id,
    action: "lead.convert",
    entityType: "lead",
    entityId: leadId,
    patientId: patient.id,
  });
  return { patientId: patient.id };
}
