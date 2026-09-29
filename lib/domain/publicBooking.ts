import { contactHash } from "@/lib/crypto/phi";
import { createPortalAccount } from "@/lib/auth/portal";
import { query } from "@/lib/db";
import { DomainError } from "@/lib/http";
import { createAppointment, findByManageToken, updateAppointment } from "@/lib/domain/appointments";
import { createPatient } from "@/lib/domain/patients";

export async function bookPublic(body: Record<string, unknown>, meta?: { ip?: string | null; userAgent?: string | null }) {
  const settings = await query<{ require_terms: boolean }>(`SELECT require_terms FROM booking_settings WHERE id = 1`);
  if (settings.rows[0]?.require_terms && body.acceptTerms !== true) {
    throw new DomainError("Debes aceptar los términos y el aviso de privacidad.");
  }
  const firstName = String(body.firstName || "").trim();
  const lastName = String(body.lastName || "").trim();
  const email = String(body.email || "").trim();
  const mobile = String(body.phone || "").trim();
  if (!firstName || !lastName || !email || !mobile) throw new DomainError("Nombre, apellido, email y teléfono son obligatorios.");
  const existing = await query<{ id: string }>(
    `SELECT id FROM patients WHERE email_hash = $1 AND deleted_at IS NULL ORDER BY created_at LIMIT 1`,
    [contactHash("email", email)]
  );
  const patient = existing.rows[0]
    ? { id: existing.rows[0].id }
    : await createPatient(
        {
          firstName,
          lastName,
          email,
          mobile,
          locationId: String(body.locationId || "") || null,
          marketingSourceId: null,
          privacyPolicyStatus: "aceptado",
          consentEmail: true,
          consentSms: true,
        },
        null,
        meta
      );
  if (!existing.rows[0]) {
    const source = await query<{ id: string }>(`SELECT id FROM marketing_sources WHERE name = 'Sitio web' LIMIT 1`);
    if (source.rows[0]) {
      await query(`UPDATE patients SET marketing_source_id = $2 WHERE id = $1`, [patient.id, source.rows[0].id]);
    }
  }
  const created = await createAppointment(
    {
      patientId: patient.id,
      serviceId: String(body.serviceId || ""),
      staffUserId: String(body.staffUserId || ""),
      locationId: String(body.locationId || ""),
      roomId: body.roomId ? String(body.roomId) : null,
      startsAt: String(body.startsAt || ""),
      endsAt: body.endsAt ? String(body.endsAt) : null,
      bookedOnline: true,
      status: "booked",
    },
    null,
    meta
  );
  if (typeof body.portalPassword === "string" && body.portalPassword.length >= 10) {
    await createPortalAccount(patient.id, email, body.portalPassword);
  }
  const form = await query<{ required_form_template_id: string | null }>(
    `SELECT required_form_template_id FROM services WHERE id = $1`,
    [String(body.serviceId || "")]
  );
  return {
    appointment: created.appointment,
    manageToken: created.appointment.manageToken,
    requiredFormTemplateId: form.rows[0]?.required_form_template_id ?? null,
  };
}

export async function managePublic(token: string, body: Record<string, unknown>, meta?: { ip?: string | null; userAgent?: string | null }) {
  const current = await findByManageToken(token);
  if (!current) throw new DomainError("Cita no encontrada.", 404);
  const settings = await query<{ cancel_window_hours: number; allow_reschedule: boolean }>(
    `SELECT cancel_window_hours, allow_reschedule FROM booking_settings WHERE id = 1`
  );
  const hours = (new Date(String(current.startsAt)).getTime() - Date.now()) / 36e5;
  if (hours < (settings.rows[0]?.cancel_window_hours ?? 24)) {
    throw new DomainError("Ya pasó el plazo para cambiar esta cita. Llama a la clínica.");
  }
  if (body.action === "cancel") {
    return updateAppointment(String(current.id), { status: "cancelled", cancelReason: "Cancelada en línea" }, null, meta);
  }
  if (body.action === "reschedule") {
    if (settings.rows[0] && settings.rows[0].allow_reschedule === false) throw new DomainError("La reprogramación en línea está desactivada.");
    return updateAppointment(
      String(current.id),
      { startsAt: String(body.startsAt || ""), endsAt: body.endsAt ? String(body.endsAt) : null, status: "booked" },
      null,
      meta
    );
  }
  throw new DomainError("Acción no válida.");
}

export async function joinWaitlist(body: Record<string, unknown>) {
  const settings = await query<{ allow_waitlist: boolean }>(`SELECT allow_waitlist FROM booking_settings WHERE id = 1`);
  if (settings.rows[0] && !settings.rows[0].allow_waitlist) throw new DomainError("La lista de espera está desactivada.");
  const patientId = body.patientId ? String(body.patientId) : null;
  if (!patientId && !body.leadId) throw new DomainError("Indica el paciente.");
  const inserted = await query<{ id: string }>(
    `INSERT INTO waitlist_entries (patient_id, lead_id, service_id, staff_user_id, location_id, desired_from, desired_to, notes)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
    [patientId, body.leadId || null, body.serviceId || null, body.staffUserId || null, body.locationId || null, body.desiredFrom || null, body.desiredTo || null, body.notes || null]
  );
  return { id: inserted.rows[0].id };
}
