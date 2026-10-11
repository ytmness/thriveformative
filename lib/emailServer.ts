import fs from "fs";
import path from "path";
import nodemailer from "nodemailer";
import sharp from "sharp";
import {
  buildThriveEmailHtml,
  EMAIL_IMAGE_CIDS,
  emailParagraph,
  emailSignOff,
  escapeHtml,
} from "@/lib/emailTemplate";
import { query } from "@/lib/db";
import { getSmtpEnv } from "@/lib/env/server";
import { log } from "@/lib/log";

const FROM = "Thrive Formative <info@thriveformative.com>";

function getTransport() {
  const smtp = getSmtpEnv();

  return nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.secure,
    tls: { rejectUnauthorized: smtp.rejectUnauthorized },
    ...(smtp.user && smtp.pass ? { auth: { user: smtp.user, pass: smtp.pass } } : {}),
  });
}

function isValidEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s || "");
}

function emailAssetDir() {
  const candidates = [
    path.join(process.cwd(), "public", "emails"),
    path.join(process.cwd(), "..", "..", "public", "emails"),
  ];
  return candidates.find((dir) => fs.existsSync(path.join(dir, "header.png"))) || candidates[0];
}

async function composedFooter(dir: string) {
  const barWidth = 600;
  const barHeight = Math.round((191 / 1991) * barWidth);
  const phoneWidth = 210;
  const phoneHeight = Math.round((68 / 525) * phoneWidth);
  const bar = await sharp(path.join(dir, "footer-bar.png")).resize(barWidth, barHeight).png().toBuffer();
  const phone = await sharp(path.join(dir, "footer-phone.png")).resize(phoneWidth, phoneHeight).png().toBuffer();
  return sharp(bar)
    .composite([{ input: phone, left: 22, top: Math.max(0, Math.round((barHeight - phoneHeight) / 2)) }])
    .png()
    .toBuffer();
}

async function emailAttachments() {
  const dir = emailAssetDir();
  const headerPath = path.join(dir, "header.png");
  const attachments = [];
  if (fs.existsSync(headerPath)) {
    attachments.push({
      filename: "header.png",
      path: headerPath,
      cid: EMAIL_IMAGE_CIDS.header,
      contentType: "image/png",
      contentDisposition: "inline" as const,
    });
  }
  if (fs.existsSync(path.join(dir, "footer-bar.png")) && fs.existsSync(path.join(dir, "footer-phone.png"))) {
    attachments.push({
      filename: "footer.png",
      content: await composedFooter(dir),
      cid: EMAIL_IMAGE_CIDS.footerBar,
      contentType: "image/png",
      contentDisposition: "inline" as const,
    });
  }
  return attachments;
}

async function deliverMail(to: string, subject: string, text: string, html: string) {
  const transport = getTransport();
  const info = await transport.sendMail({
    from: FROM,
    to,
    subject,
    text,
    html,
    attachments: await emailAttachments(),
  });
  return info.messageId;
}

/** Mismo correo de la clínica, para recordatorios y avisos que ya no pasan por el formulario público. */
export async function sendClinicEmail(
  to: string,
  subject: string,
  text: string,
  locale: "en" | "es" = "es",
): Promise<{ ok: boolean; id?: string; error?: string }> {
  if (!isValidEmail(to)) return { ok: false, error: "Email destinatario no válido" };
  const paragraphs = text
    .split(/\n{2,}/)
    .filter(Boolean)
    .map((block) => emailParagraph(escapeHtml(block).replace(/\n/g, "<br>")))
    .join("");
  try {
    const id = await deliverMail(to, subject, text, buildThriveEmailHtml(`${paragraphs}${emailSignOff(locale)}`));
    return { ok: true, id };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    log.error("sendEmail", message, { kind: "clinic" });
    return { ok: false, error: message };
  }
}

function fillTemplate(template: string, vars: Record<string, string>) {
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key: string) => vars[key] ?? "");
}

/** Envía un correo con el texto guardado en message_templates, dentro del formato visual del servidor. */
export async function sendSavedTemplateEmail(input: {
  templateKey: string;
  locale?: string;
  to: string;
  vars: Record<string, string>;
  fallbackSubject: string;
  fallbackText: string;
}) {
  const locale = input.locale || "es";
  const saved = await query<{ subject: string | null; body: string }>(
    `SELECT subject, body FROM message_templates
     WHERE channel = 'email' AND is_active AND template_key = $1 AND locale = $2
     LIMIT 1`,
    [input.templateKey, locale]
  ).catch(() => ({ rows: [] as { subject: string | null; body: string }[] }));
  const row = saved.rows[0];
  let subject = row?.subject ? fillTemplate(row.subject, input.vars) : input.fallbackSubject;
  let text = row?.body ? fillTemplate(row.body, input.vars) : input.fallbackText;
  const mailLocale = locale === "en" ? "en" : "es";
  if (mailLocale === "en" && /código|hola,|caduca|correo|saludos/i.test(`${subject}\n${text}`)) {
    subject = input.fallbackSubject;
    text = input.fallbackText;
  }
  return sendClinicEmail(input.to, subject, text, mailLocale);
}

export type EmailKind =
  | { kind: "appointment_pending"; to: string; date: string; timeSlot: string; locale?: "en" | "es" }
  | { kind: "appointment_confirmed"; to: string; date: string; timeSlot: string; locale?: "en" | "es" }
  | { kind: "appointment_cancelled"; to: string; date: string; timeSlot: string; locale?: "en" | "es" }
  | { kind: "contact_confirmation"; to: string; name: string }
  | { kind: "contact_notify_admin"; to: string; name: string; email: string; subject: string | null; message: string };

function appointmentMail(
  locale: "en" | "es",
  kind: "appointment_pending" | "appointment_confirmed" | "appointment_cancelled",
  date: string,
  timeSlot: string,
) {
  const safeDate = escapeHtml(date);
  const safeTime = escapeHtml(timeSlot);
  if (locale === "en") {
    if (kind === "appointment_pending") {
      return {
        subject: "Thrive Formative – Appointment received, pending approval",
        text: `Hello,\n\nYour appointment request for ${date} at ${timeSlot} was received and is pending approval. We will email you when it is confirmed or if we need another time.\n\nBest regards,\nThrive Formative`,
        html: `${emailParagraph("Hello,")}${emailParagraph(
          `Your appointment request for <strong>${safeDate}</strong> at <strong>${safeTime}</strong> was received and is <strong>pending approval</strong>. We will email you when it is confirmed or if we need another time.`,
        )}`,
      };
    }
    if (kind === "appointment_confirmed") {
      return {
        subject: "Thrive Formative – Appointment confirmed",
        text: `Hello,\n\nYour appointment on ${date} at ${timeSlot} is confirmed.\n\nBest regards,\nThrive Formative`,
        html: `${emailParagraph("Hello,")}${emailParagraph(
          `Your appointment on <strong>${safeDate}</strong> at <strong>${safeTime}</strong> is <strong>confirmed</strong>.`,
        )}`,
      };
    }
    return {
      subject: "Thrive Formative – Appointment cancelled",
      text: `Hello,\n\nYour appointment on ${date} at ${timeSlot} was cancelled. You can book another time on the website.\n\nBest regards,\nThrive Formative`,
      html: `${emailParagraph("Hello,")}${emailParagraph(
        `Your appointment on <strong>${safeDate}</strong> at <strong>${safeTime}</strong> was <strong>cancelled</strong>. You can book another time on the website.`,
      )}`,
    };
  }
  if (kind === "appointment_pending") {
    return {
      subject: "Thrive Formative – Cita recibida, pendiente de aprobación",
      text: `Hola,\n\nTu solicitud de cita para el ${date} a las ${timeSlot} ha sido recibida y está pendiente de aprobación. Te avisaremos por correo cuando sea confirmada o si necesitamos otro horario.\n\nSaludos,\nThrive Formative`,
      html: `${emailParagraph("Hola,")}${emailParagraph(
        `Tu solicitud de cita para el <strong>${safeDate}</strong> a las <strong>${safeTime}</strong> ha sido recibida y está <strong>pendiente de aprobación</strong>. Te avisaremos por correo cuando sea confirmada o si necesitamos otro horario.`,
      )}`,
    };
  }
  if (kind === "appointment_confirmed") {
    return {
      subject: "Thrive Formative – Cita confirmada",
      text: `Hola,\n\nTu cita del ${date} a las ${timeSlot} ha sido confirmada.\n\nSaludos,\nThrive Formative`,
      html: `${emailParagraph("Hola,")}${emailParagraph(
        `Tu cita del <strong>${safeDate}</strong> a las <strong>${safeTime}</strong> ha sido <strong>confirmada</strong>.`,
      )}`,
    };
  }
  return {
    subject: "Thrive Formative – Cita cancelada",
    text: `Hola,\n\nTu cita del ${date} a las ${timeSlot} ha sido cancelada. Si deseas reagendar, puedes hacerlo desde la web.\n\nSaludos,\nThrive Formative`,
    html: `${emailParagraph("Hola,")}${emailParagraph(
      `Tu cita del <strong>${safeDate}</strong> a las <strong>${safeTime}</strong> ha sido <strong>cancelada</strong>. Si deseas reagendar, puedes hacerlo desde la web.`,
    )}`,
  };
}

export async function sendEmailPayload(payload: EmailKind): Promise<{ ok: boolean; error?: string }> {
  try {
    let to: string;
    let subject: string;
    let html: string;
    let text: string;

    switch (payload.kind) {
      case "appointment_pending":
      case "appointment_confirmed":
      case "appointment_cancelled": {
        const mail = appointmentMail(payload.locale === "en" ? "en" : "es", payload.kind, payload.date, payload.timeSlot);
        to = payload.to;
        subject = mail.subject;
        text = mail.text;
        html = buildThriveEmailHtml(`${mail.html}${emailSignOff(payload.locale === "en" ? "en" : "es")}`);
        break;
      }
      case "contact_confirmation":
        to = payload.to;
        subject = "Thrive Formative – Hemos recibido tu mensaje";
        text = `Hola ${payload.name},\n\nHemos recibido tu mensaje de contacto. Te responderemos lo antes posible.\n\nSaludos,\nThrive Formative`;
        html = buildThriveEmailHtml(
          `${emailParagraph(`Hola ${escapeHtml(payload.name)},`)}${emailParagraph(
            "Hemos recibido tu mensaje de contacto. Te responderemos lo antes posible.",
          )}${emailSignOff()}`,
        );
        break;
      case "contact_notify_admin":
        to = payload.to;
        subject = `Thrive Formative – Nueva solicitud de contacto: ${payload.subject || "(sin asunto)"}`;
        text = `Nueva solicitud de contacto:\n\nNombre: ${payload.name}\nEmail: ${payload.email}\nAsunto: ${payload.subject || "(no indicado)"}\n\nMensaje:\n${payload.message}`;
        html = buildThriveEmailHtml(
          `${emailParagraph("<strong>Nueva solicitud de contacto</strong>")}${emailParagraph(
            `<strong>Nombre:</strong> ${escapeHtml(payload.name)}<br><strong>Email:</strong> ${escapeHtml(payload.email)}<br><strong>Asunto:</strong> ${escapeHtml(payload.subject || "(no indicado)")}`,
          )}${emailParagraph(`<strong>Mensaje:</strong><br>${escapeHtml(payload.message).replace(/\n/g, "<br>")}`)}${emailSignOff()}`,
        );
        break;
      default:
        return { ok: false, error: "Tipo de email no válido" };
    }

    if (!isValidEmail(to)) {
      return { ok: false, error: "Email destinatario no válido" };
    }

    await deliverMail(to, subject, text, html);
    log.info("sendEmail", "sent", { kind: payload.kind });
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    log.error("sendEmail", message, { kind: (payload as EmailKind).kind });
    return { ok: false, error: message };
  }
}
