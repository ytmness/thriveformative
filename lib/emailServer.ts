import nodemailer from "nodemailer";

const FROM = "Thrive Formative <info@thriveformative.com>";

function getTransport() {
  const host = process.env.SMTP_HOST || "localhost";
  const port = Number(process.env.SMTP_PORT || "25");
  const secure = process.env.SMTP_SECURE === "true";
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  return nodemailer.createTransport({
    host,
    port,
    secure,
    ...(user && pass ? { auth: { user, pass } } : {}),
  });
}

function isValidEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s || "");
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
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
        html = `<p>Hola,</p><p>Tu solicitud de cita para el <strong>${escapeHtml(payload.date)}</strong> a las <strong>${escapeHtml(payload.timeSlot)}</strong> ha sido recibida y está <strong>pendiente de aprobación</strong>. Te avisaremos por correo cuando sea confirmada o si necesitamos otro horario.</p><p>Saludos,<br>Thrive Formative</p>`;
        break;
      case "appointment_confirmed":
        to = payload.to;
        subject = "Thrive Formative – Cita confirmada";
        text = `Hola,\n\nTu cita del ${payload.date} a las ${payload.timeSlot} ha sido confirmada.\n\nSaludos,\nThrive Formative`;
        html = `<p>Hola,</p><p>Tu cita del <strong>${escapeHtml(payload.date)}</strong> a las <strong>${escapeHtml(payload.timeSlot)}</strong> ha sido <strong>confirmada</strong>.</p><p>Saludos,<br>Thrive Formative</p>`;
        break;
      case "appointment_cancelled":
        to = payload.to;
        subject = "Thrive Formative – Cita cancelada";
        text = `Hola,\n\nTu cita del ${payload.date} a las ${payload.timeSlot} ha sido cancelada. Si deseas reagendar, puedes hacerlo desde la web.\n\nSaludos,\nThrive Formative`;
        html = `<p>Hola,</p><p>Tu cita del <strong>${escapeHtml(payload.date)}</strong> a las <strong>${escapeHtml(payload.timeSlot)}</strong> ha sido <strong>cancelada</strong>. Si deseas reagendar, puedes hacerlo desde la web.</p><p>Saludos,<br>Thrive Formative</p>`;
        break;
      case "contact_confirmation":
        to = payload.to;
        subject = "Thrive Formative – Hemos recibido tu mensaje";
        text = `Hola ${payload.name},\n\nHemos recibido tu mensaje de contacto. Te responderemos lo antes posible.\n\nSaludos,\nThrive Formative`;
        html = `<p>Hola ${escapeHtml(payload.name)},</p><p>Hemos recibido tu mensaje de contacto. Te responderemos lo antes posible.</p><p>Saludos,<br>Thrive Formative</p>`;
        break;
      case "contact_notify_admin":
        to = payload.to;
        subject = `Thrive Formative – Nueva solicitud de contacto: ${payload.subject || "(sin asunto)"}`;
        text = `Nueva solicitud de contacto:\n\nNombre: ${payload.name}\nEmail: ${payload.email}\nAsunto: ${payload.subject || "(no indicado)"}\n\nMensaje:\n${payload.message}`;
        html = `<p><strong>Nueva solicitud de contacto</strong></p><p><strong>Nombre:</strong> ${escapeHtml(payload.name)}<br><strong>Email:</strong> ${escapeHtml(payload.email)}<br><strong>Asunto:</strong> ${escapeHtml(payload.subject || "(no indicado)")}</p><p><strong>Mensaje:</strong></p><p>${escapeHtml(payload.message).replace(/\n/g, "<br>")}</p>`;
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
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[sendEmail]", (payload as EmailKind).kind, "→", message);
    return { ok: false, error: message };
  }
}
