import { decryptPhi, encryptPhi } from "@/lib/crypto/phi";
import { query } from "@/lib/db";
import { sendClinicEmail, sendEmailPayload } from "@/lib/emailServer";
import { getNotifyEmail } from "@/lib/env/server";
import { log } from "@/lib/log";
import { formatDate, formatHm } from "@/lib/scheduling/time";

type Kind = "pending" | "confirmed" | "cancelled";

const COPY: Record<Kind, { type: string; title: string; patientTitle: string; patientTitleEn: string; email: "appointment_pending" | "appointment_confirmed" | "appointment_cancelled" }> = {
  pending: { type: "appointment_pending", title: "Nueva cita por confirmar", patientTitle: "Cita agendada", patientTitleEn: "Appointment booked", email: "appointment_pending" },
  confirmed: { type: "appointment_confirmed", title: "Cita confirmada", patientTitle: "Cita confirmada", patientTitleEn: "Appointment confirmed", email: "appointment_confirmed" },
  cancelled: { type: "appointment_cancelled", title: "Cita cancelada", patientTitle: "Cita cancelada", patientTitleEn: "Appointment cancelled", email: "appointment_cancelled" },
};

export async function notifyAppointment(appointmentId: string, kind: Kind) {
  const found = await query<{
    starts_at: string;
    patient_id: string | null;
    email_enc: Buffer | null;
    first_name: string | null;
    last_name: string | null;
    timezone: string | null;
    location_name: string | null;
    service_name: string | null;
    preferred_language: string | null;
  }>(
    `SELECT a.starts_at, a.patient_id, p.email_enc, p.first_name, p.last_name, l.timezone,
            l.name AS location_name, s.name AS service_name, p.preferred_language
     FROM appointments a
     LEFT JOIN patients p ON p.id = a.patient_id
     LEFT JOIN locations l ON l.id = a.location_id
     LEFT JOIN services s ON s.id = a.service_id
     WHERE a.id = $1`,
    [appointmentId]
  );
  const row = found.rows[0];
  if (!row) return;
  const tz = row.timezone || "America/Chicago";
  const starts = new Date(row.starts_at);
  const date = formatDate(starts, tz);
  const timeSlot = formatHm(starts, tz);
  const who = `${row.first_name || ""} ${row.last_name || ""}`.trim() || "Paciente";
  const service = row.service_name || "consulta";
  const place = row.location_name || "Thrive Formative";
  const copy = COPY[kind];
  const english = row.preferred_language === "en";
  const email = decryptPhi(row.email_enc);
  if (email) {
    const result = await sendEmailPayload({ kind: copy.email, to: email, date, timeSlot, locale: english ? "en" : "es" });
    await query(
      `INSERT INTO messages (channel, recipient_enc, patient_id, appointment_id, subject, body, status, scheduled_for, sent_at, error, provider)
       VALUES ('email',$1,$2,$3,$4,$5,$6, now(), CASE WHEN $6 = 'sent' THEN now() ELSE NULL END, $7, 'smtp')`,
      [
        encryptPhi(email),
        row.patient_id,
        appointmentId,
        english ? `Thrive Formative – ${copy.patientTitleEn}` : `Thrive Formative – ${copy.title}`,
        english ? `${who}: appointment on ${date} at ${timeSlot}.` : `${who}: cita del ${date} a las ${timeSlot}.`,
        result.ok ? "sent" : "failed",
        result.ok ? null : result.error || "No se pudo enviar",
      ]
    );
    if (!result.ok) log.warn("notify", "correo de cita no enviado", { kind });
  }
  if (kind === "pending") {
    const inbox = getNotifyEmail();
    if (inbox) {
      await sendClinicEmail(
        inbox,
        "Thrive Formative – Nueva cita por confirmar",
        `${who} pidió cita para el ${date} a las ${timeSlot}. Entra al calendario del panel para confirmarla.`
      ).catch(() => undefined);
    }
  }
  const clinicBody = kind === "pending"
    ? `${who} acaba de agendar una cita de ${service} para el ${date} a las ${timeSlot} en ${place}.`
    : `${who} · ${service} · ${date} a las ${timeSlot} en ${place}`;
  await query(
    `INSERT INTO notifications (type, title, body, reference_id) VALUES ($1,$2,$3,$4)`,
    [copy.type, kind === "pending" ? "Nueva cita agendada" : copy.title, clinicBody, appointmentId]
  );
  if (row.patient_id) {
    await query(
      `INSERT INTO notifications (type, title, body, reference_id, patient_id) VALUES ($1,$2,$3,$4,$5)`,
      [
        copy.type,
        english ? copy.patientTitleEn : copy.patientTitle,
        english ? `Your appointment on ${date} at ${timeSlot}.` : `Tu cita del ${date} a las ${timeSlot}.`,
        appointmentId,
        row.patient_id,
      ]
    );
  }
}
