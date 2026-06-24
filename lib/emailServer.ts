import nodemailer from "nodemailer";
import {
  buildThriveEmailHtml,
  emailParagraph,
  emailSignOff,
  escapeHtml,
} from "@/lib/emailTemplate";
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

export type EmailKind =
  | { kind: "appointment_pending"; to: string; date: string; timeSlot: string }
  | { kind: "appointment_confirmed"; to: string; date: string; timeSlot: string }
  | { kind: "appointment_cancelled"; to: string; date: string; timeSlot: string }
  | { kind: "contact_confirmation"; to: string; name: string }
  | { kind: "contact_notify_admin"; to: string; name: string; email: string; subject: string | null; message: string };

export async function sendEmailPayload(payload: EmailKind): Promise<{ ok: boolean; error?: string }> {
  try {
    let to: string;
    let subject: string;
    let html: string;
    let text: string;

    switch (payload.kind) {
      case "appointment_pending":
        to = payload.to;
        subject = "Thrive Formative – Cita recibida, pendiente de aprobación";
        text = `Hola,\n\nTu solicitud de cita para el ${payload.date} a las ${payload.timeSlot} ha sido recibida y está pendiente de aprobación. Te avisaremos por correo cuando sea confirmada o si necesitamos otro horario.\n\nSaludos,\nThrive Formative`;
        html = buildThriveEmailHtml(
          `${emailParagraph("Hola,")}${emailParagraph(
            `Tu solicitud de cita para el <strong>${escapeHtml(payload.date)}</strong> a las <strong>${escapeHtml(payload.timeSlot)}</strong> ha sido recibida y está <strong>pendiente de aprobación</strong>. Te avisaremos por correo cuando sea confirmada o si necesitamos otro horario.`,
          )}${emailSignOff()}`,
        );
        break;
      case "appointment_confirmed":
        to = payload.to;
        subject = "Thrive Formative – Cita confirmada";
        text = `Hola,\n\nTu cita del ${payload.date} a las ${payload.timeSlot} ha sido confirmada.\n\nSaludos,\nThrive Formative`;
        html = buildThriveEmailHtml(
          `${emailParagraph("Hola,")}${emailParagraph(
            `Tu cita del <strong>${escapeHtml(payload.date)}</strong> a las <strong>${escapeHtml(payload.timeSlot)}</strong> ha sido <strong>confirmada</strong>.`,
          )}${emailSignOff()}`,
        );
        break;
      case "appointment_cancelled":
        to = payload.to;
        subject = "Thrive Formative – Cita cancelada";
        text = `Hola,\n\nTu cita del ${payload.date} a las ${payload.timeSlot} ha sido cancelada. Si deseas reagendar, puedes hacerlo desde la web.\n\nSaludos,\nThrive Formative`;
        html = buildThriveEmailHtml(
          `${emailParagraph("Hola,")}${emailParagraph(
            `Tu cita del <strong>${escapeHtml(payload.date)}</strong> a las <strong>${escapeHtml(payload.timeSlot)}</strong> ha sido <strong>cancelada</strong>. Si deseas reagendar, puedes hacerlo desde la web.`,
          )}${emailSignOff()}`,
        );
        break;
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

    const transport = getTransport();
    await transport.sendMail({
      from: FROM,
      to,
      subject,
      text,
      html,
    });
    log.info("sendEmail", "sent", { kind: payload.kind });
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    log.error("sendEmail", message, { kind: (payload as EmailKind).kind });
    return { ok: false, error: message };
  }
}
