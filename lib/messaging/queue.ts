import { decryptPhi, encryptPhi } from "@/lib/crypto/phi";
import { query } from "@/lib/db";
import { sendClinicEmail } from "@/lib/emailServer";
import { log } from "@/lib/log";
import { formatDate, formatHm } from "@/lib/scheduling/time";
import { getSiteUrl } from "@/lib/env/server";

function render(template: string, vars: Record<string, string>) {
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key: string) => vars[key] ?? "");
}

export async function enqueueForAppointment(appointmentId: string, trigger: string, manageToken?: string | null) {
  const appt = await query<{
    id: string;
    starts_at: string;
    patient_id: string | null;
    email_enc: Buffer | null;
    mobile_enc: Buffer | null;
    first_name: string | null;
    service_name: string | null;
    staff_first: string | null;
    staff_last: string | null;
    location_name: string | null;
    timezone: string | null;
    manage_token_hash: string | null;
  }>(
    `SELECT a.id, a.starts_at, a.patient_id, p.email_enc, p.mobile_enc, p.first_name,
            s.name AS service_name, u.first_name AS staff_first, u.last_name AS staff_last,
            l.name AS location_name, l.timezone, a.manage_token_hash
     FROM appointments a
     LEFT JOIN patients p ON p.id = a.patient_id
     LEFT JOIN services s ON s.id = a.service_id
     LEFT JOIN staff_users u ON u.id = a.staff_user_id
     LEFT JOIN locations l ON l.id = a.location_id
     WHERE a.id = $1`,
    [appointmentId]
  );
  const row = appt.rows[0];
  if (!row) return;
  const tz = row.timezone || "America/Chicago";
  const starts = new Date(row.starts_at);
  const email = decryptPhi(row.email_enc);
  const mobile = decryptPhi(row.mobile_enc);
  const vars = {
    nombre: row.first_name || "",
    servicio: row.service_name || "cita",
    fecha: formatDate(starts, tz),
    hora: formatHm(starts, tz),
    sede: row.location_name || "Thrive Formative",
    profesional: `${row.staff_first || ""} ${row.staff_last || ""}`.trim(),
    enlace: manageToken ? `${getSiteUrl()}/reservar/${manageToken}` : `${getSiteUrl()}/reservar`,
  };
  const rules = await query<{
    id: string;
    offset_minutes: number;
    channel: string;
    subject: string | null;
    body: string;
    template_id: string;
  }>(
    `SELECT r.id, r.offset_minutes, r.channel, t.subject, t.body, t.id AS template_id
     FROM message_rules r
     JOIN message_templates t ON t.id = r.template_id
     WHERE r.is_active AND r.trigger_key = $1 AND t.is_active`,
    [trigger]
  );
  for (const rule of rules.rows) {
    const recipient = rule.channel === "sms" ? mobile : email;
    if (!recipient) continue;
    const scheduled =
      trigger === "recordatorio" ? new Date(starts.getTime() + rule.offset_minutes * 60000) : new Date();
    if (trigger === "recordatorio" && scheduled.getTime() < Date.now()) continue;
    await query(
      `INSERT INTO messages
        (channel, recipient_enc, patient_id, appointment_id, template_id, rule_id, subject, body, scheduled_for)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       ON CONFLICT DO NOTHING`,
      [
        rule.channel,
        encryptPhi(recipient),
        row.patient_id,
        appointmentId,
        rule.template_id,
        rule.id,
        rule.subject ? render(rule.subject, vars) : null,
        render(rule.body, vars),
        scheduled.toISOString(),
      ]
    );
  }
}

async function sendEmail(to: string, subject: string, text: string) {
  const result = await sendClinicEmail(to, subject, text);
  if (!result.ok) return { error: result.error || "No se pudo enviar el correo" };
  return { id: result.id, provider: "smtp" };
}

async function sendSms(to: string, body: string) {
  const sid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const token = process.env.TWILIO_AUTH_TOKEN?.trim();
  const from = process.env.TWILIO_FROM?.trim();
  if (!sid || !token || !from) return { skipped: true as const, error: "Twilio no configurado" };
  const auth = Buffer.from(`${sid}:${token}`).toString("base64");
  const form = new URLSearchParams({ To: to, From: from, Body: body });
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: "POST",
    headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: form,
  });
  if (!res.ok) return { error: "No se pudo enviar el SMS" };
  const json = (await res.json()) as { sid?: string };
  return { id: json.sid, provider: "twilio" };
}

export async function dispatchDueMessages(limit = 40) {
  const due = await query<{ id: string }>(
    `SELECT id FROM messages WHERE status = 'queued' AND scheduled_for <= now() ORDER BY scheduled_for LIMIT $1`,
    [limit]
  );
  let sent = 0;
  for (const item of due.rows) {
    const row = await query<{
      id: string;
      channel: string;
      recipient_enc: Buffer | null;
      subject: string | null;
      body: string;
    }>(`SELECT id, channel, recipient_enc, subject, body FROM messages WHERE id = $1 AND status = 'queued'`, [
      item.id,
    ]);
    const message = row.rows[0];
    if (!message) continue;
    const recipient = decryptPhi(message.recipient_enc);
    if (!recipient) {
      await query(`UPDATE messages SET status = 'skipped', error = 'sin destinatario' WHERE id = $1`, [message.id]);
      continue;
    }
    try {
      const result =
        message.channel === "sms"
          ? await sendSms(recipient, message.body)
          : await sendEmail(recipient, message.subject || "Thrive Formative", message.body);
      if ("skipped" in result && result.skipped) {
        await query(`UPDATE messages SET status = 'skipped', error = $2 WHERE id = $1`, [message.id, result.error]);
      } else if (result.error) {
        await query(`UPDATE messages SET status = 'failed', error = $2 WHERE id = $1`, [message.id, result.error]);
      } else {
        await query(
          `UPDATE messages SET status = 'sent', sent_at = now(), provider = $2, provider_id = $3, error = NULL WHERE id = $1`,
          [message.id, result.provider ?? null, result.id ?? null]
        );
        sent += 1;
      }
    } catch (error) {
      log.error("messages", "envío fallido", { name: error instanceof Error ? error.name : "error" });
      await query(`UPDATE messages SET status = 'failed', error = 'error de envío' WHERE id = $1`, [message.id]);
    }
  }
  return { processed: due.rows.length, sent };
}
