import { createHash, randomBytes } from "crypto";
import { writeAudit } from "@/lib/audit";
import type { StaffSession } from "@/lib/auth/session";
import { decryptPhi, encryptPhi } from "@/lib/crypto/phi";
import { query } from "@/lib/db";
import { sendClinicEmail } from "@/lib/emailServer";
import { getSiteUrl } from "@/lib/env/server";
import { DomainError } from "@/lib/http";
import { log } from "@/lib/log";
import { savePrivateFile } from "@/lib/files/privateStore";

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function listTemplates() {
  const rows = await query(`SELECT id, name, form_type, schema, requires_signature, version, is_active, updated_at FROM form_templates WHERE is_active ORDER BY name`);
  return rows.rows;
}

export async function saveTemplate(id: string | null, body: Record<string, unknown>, actor: StaffSession) {
  const name = String(body.name || "").trim();
  if (!name) throw new DomainError("El nombre es obligatorio.");
  const schema = JSON.stringify(body.schema ?? []);
  if (!id) {
    const inserted = await query<{ id: string }>(
      `INSERT INTO form_templates (name, form_type, schema, requires_signature, is_active)
       VALUES ($1,$2,$3::jsonb,$4,$5) RETURNING id`,
      [name, body.formType || "custom", schema, Boolean(body.requiresSignature), body.isActive !== false]
    );
    await writeAudit({ actorType: "staff", actorId: actor.staff.id, action: "form_template.create", entityType: "form_template", entityId: inserted.rows[0].id });
    return { id: inserted.rows[0].id };
  }
  await query(
    `UPDATE form_templates SET name=$2, form_type=$3, schema=$4::jsonb, requires_signature=$5, is_active=$6, version=version+1 WHERE id=$1`,
    [id, name, body.formType || "custom", schema, Boolean(body.requiresSignature), body.isActive !== false]
  );
  return { id };
}

export async function archiveTemplate(id: string, actor: StaffSession) {
  const updated = await query(`UPDATE form_templates SET is_active = false, updated_at = now() WHERE id = $1 AND is_active RETURNING id`, [id]);
  if (!updated.rows[0]) throw new DomainError("Plantilla no encontrada.", 404);
  await writeAudit({
    actorType: "staff",
    actorId: actor.staff.id,
    action: "form_template.archive",
    entityType: "form_template",
    entityId: id,
  });
  return { id };
}

export async function assignForm(body: Record<string, unknown>, actor: StaffSession) {
  const templateId = String(body.templateId || "");
  const patientId = String(body.patientId || "");
  if (!templateId || !patientId) throw new DomainError("Plantilla y paciente son obligatorios.");
  const token = randomBytes(24).toString("base64url");
  const inserted = await query<{ id: string }>(
    `INSERT INTO form_assignments (template_id, patient_id, appointment_id, status, access_token_hash, sent_at, due_at)
     VALUES ($1,$2,$3,'sent',$4,now(),$5) RETURNING id`,
    [templateId, patientId, body.appointmentId || null, hashToken(token), body.dueAt || null]
  );
  await writeAudit({
    actorType: "staff",
    actorId: actor.staff.id,
    action: "form.assign",
    entityType: "form_assignment",
    entityId: inserted.rows[0].id,
    patientId,
  });
  try {
    await notifyFormAssignment({
      assignmentId: inserted.rows[0].id,
      patientId,
      templateId,
      token,
    });
  } catch {
    log.warn("notify", "no se pudo avisar del formulario");
  }
  return { id: inserted.rows[0].id, token };
}

async function notifyFormAssignment(input: { assignmentId: string; patientId: string; templateId: string; token: string }) {
  const found = await query<{ name: string; email_enc: Buffer | null; first_name: string | null; preferred_language: string | null }>(
    `SELECT t.name, p.email_enc, p.first_name, p.preferred_language
     FROM form_templates t
     JOIN patients p ON p.id = $2
     WHERE t.id = $1`,
    [input.templateId, input.patientId]
  );
  const row = found.rows[0];
  const english = row?.preferred_language === "en";
  const formName = row?.name || (english ? "Form" : "Formulario");
  const link = `${getSiteUrl().replace(/\/$/, "")}/portal/formularios/${input.token}`;
  await query(
    `INSERT INTO notifications (type, title, body, reference_id, patient_id)
     VALUES ('form_assigned', $1, $2, $3, $4)`,
    [
      english ? "You have a form to complete" : "Tienes un formulario por responder",
      english ? `${formName}. Open it from the email we sent you.` : `${formName}. Ábrelo desde el correo que te enviamos.`,
      input.assignmentId,
      input.patientId,
    ]
  ).catch(() => undefined);
  const email = decryptPhi(row?.email_enc);
  if (!email) return;
  const who = row?.first_name?.trim() || (english ? "Hello" : "Hola");
  const result = await sendClinicEmail(
    email,
    english ? "Thrive Formative – You have a form to complete" : "Thrive Formative – Tienes un formulario por responder",
    english
      ? `Hello ${who},\n\nYou have a form to complete: ${formName}.\n\nOpen this link to finish it:\n${link}`
      : `Hola ${who},\n\nTienes un formulario por responder: ${formName}.\n\nEntra aquí para completarlo:\n${link}`,
    english ? "en" : "es",
  );
  if (!result.ok) log.warn("notify", "correo de formulario no enviado");
}

export async function assignmentByToken(token: string) {
  const rows = await query(
    `SELECT a.id, a.status, a.patient_id, t.name, t.schema, t.requires_signature, t.form_type
     FROM form_assignments a JOIN form_templates t ON t.id = a.template_id
     WHERE a.access_token_hash = $1`,
    [hashToken(token)]
  );
  return rows.rows[0] ?? null;
}

export async function submitForm(token: string, answers: unknown, signatureDataUrl: string | null, signerName: string | null, meta?: { ip?: string | null; userAgent?: string | null }) {
  const assignment = await assignmentByToken(token);
  if (!assignment) throw new DomainError("Formulario no encontrado.", 404);
  if (assignment.status === "completed") throw new DomainError("Este formulario ya fue enviado.");
  if (assignment.requires_signature && !signatureDataUrl) throw new DomainError("La firma es obligatoria.");
  let signaturePath: string | null = null;
  if (signatureDataUrl?.startsWith("data:image/png;base64,")) {
    const data = Buffer.from(signatureDataUrl.slice("data:image/png;base64,".length), "base64");
    signaturePath = await savePrivateFile(assignment.patient_id, "firma.png", data);
  }
  await query(
    `INSERT INTO form_submissions (assignment_id, answers_enc, signature_path, signed_at, signer_name, ip, user_agent)
     VALUES ($1,$2,$3, CASE WHEN $3 IS NULL THEN NULL ELSE now() END, $4, $5, $6)`,
    [assignment.id, encryptPhi(JSON.stringify(answers ?? {})), signaturePath, signerName, meta?.ip ?? null, meta?.userAgent ?? null]
  );
  await query(`UPDATE form_assignments SET status = 'completed', completed_at = now() WHERE id = $1`, [assignment.id]);
  await writeAudit({
    actorType: "patient",
    actorId: assignment.patient_id,
    action: "form.submit",
    entityType: "form_assignment",
    entityId: assignment.id,
    patientId: assignment.patient_id,
    ip: meta?.ip,
    userAgent: meta?.userAgent,
  });
}

export async function listPatientForms(patientId: string, actor: StaffSession) {
  const rows = await query(
    `SELECT a.id, a.status, a.sent_at, a.completed_at, a.due_at, t.name, t.form_type,
            s.answers_enc, s.signer_name, s.signed_at
     FROM form_assignments a
     JOIN form_templates t ON t.id = a.template_id
     LEFT JOIN form_submissions s ON s.assignment_id = a.id
     WHERE a.patient_id = $1 ORDER BY a.created_at DESC`,
    [patientId]
  );
  await writeAudit({ actorType: "staff", actorId: actor.staff.id, action: "forms.view", entityType: "patient", entityId: patientId, patientId });
  return rows.rows.map((row) => ({
    id: row.id,
    status: row.status,
    sentAt: row.sent_at,
    completedAt: row.completed_at,
    dueAt: row.due_at,
    name: row.name,
    formType: row.form_type,
    signerName: row.signer_name,
    signedAt: row.signed_at,
    answers: row.answers_enc ? JSON.parse(decryptPhi(row.answers_enc as Buffer) || "{}") : null,
  }));
}
