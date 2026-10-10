import { decryptPhi, encryptPhi } from "@/lib/crypto/phi";
import { query } from "@/lib/db";
import { sendClinicEmail, sendEmailPayload } from "@/lib/emailServer";
import { getNotifyEmail } from "@/lib/env/server";
import { log } from "@/lib/log";
import { formatDate, formatHm } from "@/lib/scheduling/time";

type Kind = "pending" | "confirmed" | "cancelled";

const COPY: Record<Kind, { type: string; title: string; patientTitle: string; email: "appointment_pending" | "appointment_confirmed" | "appointment_cancelled" }> = {
  pending: { type: "appointment_pending", title: "Nueva cita por confirmar", patientTitle: "Cita agendada", email: "appointment_pending" },
  confirmed: { type: "appointment_confirmed", title: "Cita confirmada", patientTitle: "Cita confirmada", email: "appointment_confirmed" },
  cancelled: { type: "appointment_cancelled", title: "Cita cancelada", patientTitle: "Cita cancelada", email: "appointment_cancelled" },
};

export async function notifyAppointment(appointmentId: string, kind: Kind) {
  const found = await query<{
    starts_at: string;
    patient_id: string | null;
    email_enc: Buffer | null;
    first_name: string | null;
    last_name: string | null;
    timezone: string | null;
  }>(
    `SELECT a.starts_at, a.patient_id, p.email_enc, p.first_name, p.last_name, l.timezone
     FROM appointments a
     LEFT JOIN patients p ON p.id = a.patient_id
     LEFT JOIN locations l ON l.id = a.location_id
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
  const copy = COPY[kind];
  const email = decryptPhi(row.email_enc);
  if (email) {
    const result = await sendEmailPayload({ kind: copy.email, to: email, date, timeSlot });
    await query(
      `INSERT INTO messages (channel, recipient_enc, patient_id, appointment_id, subject, body, status, scheduled_for, sent_at, error, provider)
       VALUES ('email',$1,$2,$3,$4,$5,$6, now(), CASE WHEN $6 = 'sent' THEN now() ELSE NULL END, $7, 'smtp')`,
      [
        encryptPhi(email),
        row.patient_id,
        appointmentId,
        `Thrive Formative – ${copy.title}`,
        `${who}: cita del ${date} a las ${timeSlot}.`,
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
  await query(
    `INSERT INTO notifications (type, title, body, reference_id) VALUES ($1,$2,$3,$4)`,
    [copy.type, copy.title, `${who} · ${date} a las ${timeSlot}`, appointmentId]
  );
  if (row.patient_id) {
    await query(
      `INSERT INTO notifications (type, title, body, reference_id, patient_id) VALUES ($1,$2,$3,$4,$5)`,
      [copy.type, copy.patientTitle, `Tu cita del ${date} a las ${timeSlot}.`, appointmentId, row.patient_id]
    );
  }
}
