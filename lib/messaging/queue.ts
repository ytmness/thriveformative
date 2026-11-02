import { decryptPhi, encryptPhi } from "@/lib/crypto/phi";
import { query } from "@/lib/db";
import { sendClinicEmail } from "@/lib/emailServer";
import { log } from "@/lib/log";
import { formatDate, formatHm, nextSendableAt } from "@/lib/scheduling/time";
import { getSiteUrl } from "@/lib/env/server";
import { sendText, type TextChannel } from "@/lib/messaging/providers";
import { normalizeCountry } from "@/lib/domain/scope";

function render(template: string, vars: Record<string, string>) {
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key: string) => vars[key] ?? "");
}

function isDemoPatient(row: { client_code?: string | null; first_name?: string | null; last_name?: string | null }) {
  const blob = `${row.client_code || ""} ${row.first_name || ""} ${row.last_name || ""}`.toUpperCase();
  return blob.includes("DEMO") || blob.includes("PRUEBA");
}

function locationAddress(row: { street?: string | null; city?: string | null; state?: string | null; postal_code?: string | null }) {
  return [row.street, row.city, row.state, row.postal_code].map((part) => String(part || "").trim()).filter(Boolean).join(", ");
}

function preferredTextChannel(country: string | null | undefined): TextChannel {
  return normalizeCountry(country) === "MX" ? "whatsapp" : "sms";
}

function isTextChannel(channel: string): channel is TextChannel {
  return channel === "sms" || channel === "whatsapp" || channel === "imessage";
}

export async function enqueueForAppointment(appointmentId: string, trigger: string, manageToken?: string | null) {
  const appt = await query<{
    id: string;
    starts_at: string;
    patient_id: string | null;
    email_enc: Buffer | null;
    mobile_enc: Buffer | null;
    first_name: string | null;
    client_code: string | null;
    consent_sms: boolean | null;
    consent_email: boolean | null;
    sms_opt_out: boolean | null;
    country: string | null;
    location_country: string | null;
    service_name: string | null;
    staff_first: string | null;
    staff_last: string | null;
    location_name: string | null;
    street: string | null;
    city: string | null;
    state: string | null;
    postal_code: string | null;
    timezone: string | null;
    manage_token_hash: string | null;
    preferred_language: string | null;
  }>(
    `SELECT a.id, a.starts_at, a.patient_id, p.email_enc, p.mobile_enc, p.first_name, p.client_code,
            p.consent_sms, p.consent_email, p.sms_opt_out, p.country, l.country AS location_country,
            s.name AS service_name, u.first_name AS staff_first, u.last_name AS staff_last,
            l.name AS location_name, l.street, l.city, l.state, l.postal_code, l.timezone,
            a.manage_token_hash, p.preferred_language
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
    direccion: locationAddress(row) || row.location_name || "Thrive Formative",
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
    template_key: string;
  }>(
    `SELECT r.id, r.offset_minutes, r.channel, t.subject, t.body, t.id AS template_id, t.template_key
     FROM message_rules r
     JOIN message_templates t ON t.id = r.template_id
     WHERE r.is_active AND r.trigger_key = $1 AND t.is_active`,
    [trigger]
  );
  const english = row.preferred_language === "en";
  const optedOut = Boolean(row.sms_opt_out);
  const canText = Boolean(mobile) && row.consent_sms !== false && !optedOut;
  const country = row.country || row.location_country;
  for (const rule of rules.rows) {
    let channel = rule.channel;
    if (channel === "email" && rules.rows.some((item) => isTextChannel(item.channel) && item.offset_minutes === rule.offset_minutes)) {
      continue;
    }
    if (isTextChannel(channel)) {
      if (canText) channel = preferredTextChannel(country);
      else if (email && row.consent_email !== false) channel = "email";
      else continue;
    } else if (channel === "email") {
      if (canText) continue;
      if (!email || row.consent_email === false) continue;
    }
    const recipient = channel === "email" ? email : mobile;
    if (!recipient) continue;
    let subject = rule.subject;
    let body = rule.body;
    const locale = english ? "en" : "es";
    const alt = await query<{ id: string; subject: string | null; body: string }>(
      `SELECT id, subject, body FROM message_templates
       WHERE channel = $1 AND template_key = $2 AND locale = $3 AND is_active
       LIMIT 1`,
      [channel, rule.template_key, locale]
    );
    if (alt.rows[0]) {
      subject = alt.rows[0].subject;
      body = alt.rows[0].body;
    } else if (channel !== rule.channel) {
      const fallback = await query<{ subject: string | null; body: string }>(
        `SELECT subject, body FROM message_templates
         WHERE channel = $1 AND template_key = $2 AND locale = $3 AND is_active
         LIMIT 1`,
        [rule.channel, rule.template_key, locale]
      );
      if (fallback.rows[0]) {
        subject = fallback.rows[0].subject;
        body = fallback.rows[0].body;
      }
    }
    const rawScheduled =
      trigger === "recordatorio" ? new Date(starts.getTime() + rule.offset_minutes * 60000) : new Date();
    const scheduled = nextSendableAt(rawScheduled, tz);
    if (trigger === "recordatorio" && scheduled.getTime() < Date.now()) continue;
    await query(
      `INSERT INTO messages
        (channel, recipient_enc, patient_id, appointment_id, template_id, rule_id, subject, body, scheduled_for)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       ON CONFLICT DO NOTHING`,
      [
        channel,
        encryptPhi(recipient),
        row.patient_id,
        appointmentId,
        alt.rows[0]?.id || rule.template_id,
        rule.id,
        subject ? render(subject, vars) : null,
        render(body, vars),
        scheduled.toISOString(),
      ]
    );
  }
}

async function sendEmail(to: string, subject: string, text: string, locale: "en" | "es") {
  const result = await sendClinicEmail(to, subject, text, locale);
  if (!result.ok) return { error: result.error || "No se pudo enviar el correo" };
  return { id: result.id, provider: "smtp" };
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
      preferred_language: string | null;
      client_code: string | null;
      first_name: string | null;
      last_name: string | null;
      sms_opt_out: boolean | null;
      consent_sms: boolean | null;
      timezone: string | null;
    }>(
      `SELECT m.id, m.channel, m.recipient_enc, m.subject, m.body, p.preferred_language,
              p.client_code, p.first_name, p.last_name, p.sms_opt_out, p.consent_sms, l.timezone
       FROM messages m
       LEFT JOIN patients p ON p.id = m.patient_id
       LEFT JOIN appointments a ON a.id = m.appointment_id
       LEFT JOIN locations l ON l.id = a.location_id
       WHERE m.id = $1 AND m.status = 'queued'`,
      [item.id]
    );
    const message = row.rows[0];
    if (!message) continue;
    const tz = message.timezone || "America/Chicago";
    const hold = nextSendableAt(new Date(), tz);
    if (hold.getTime() > Date.now() + 30_000 && message.channel !== "email") {
      await query(`UPDATE messages SET scheduled_for = $2 WHERE id = $1 AND status = 'queued'`, [message.id, hold.toISOString()]);
      continue;
    }
    if (isTextChannel(message.channel) && (message.sms_opt_out || message.consent_sms === false)) {
      await query(`UPDATE messages SET status = 'skipped', error = 'omitido: sin consentimiento o STOP' WHERE id = $1`, [message.id]);
      continue;
    }
    const recipient = decryptPhi(message.recipient_enc);
    if (!recipient) {
      await query(`UPDATE messages SET status = 'skipped', error = 'sin destinatario' WHERE id = $1`, [message.id]);
      continue;
    }
    try {
      const dryRun = process.env.MESSAGING_DRY_RUN === "1";
      const demo = isDemoPatient(message);
      let result: { skipped?: boolean; error?: string; id?: string; provider?: string };
      if (dryRun) {
        result = demo
          ? { id: "dry-run", provider: "dry-run" }
          : { skipped: true, error: "omitido: dry-run solo con pacientes DEMO" };
      } else if (isTextChannel(message.channel)) {
        result = await sendText(recipient, message.body, message.channel);
      } else {
        result = await sendEmail(
          recipient,
          message.subject || "Thrive Formative",
          message.body,
          message.preferred_language === "en" ? "en" : "es",
        );
      }
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

export async function clearQueuedForAppointment(appointmentId: string) {
  await query(`DELETE FROM messages WHERE appointment_id = $1 AND status = 'queued'`, [appointmentId]);
}
