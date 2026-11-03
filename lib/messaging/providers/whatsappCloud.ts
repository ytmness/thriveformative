import type { MessagingProvider, SendResult } from "@/lib/messaging/providers/types";

function e164Digits(value: string) {
  return value.replace(/\D/g, "");
}

export const whatsappCloud: MessagingProvider = {
  name: "whatsapp-cloud",
  async send(to, body): Promise<SendResult> {
    const token = process.env.WHATSAPP_TOKEN?.trim();
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID?.trim();
    const templateName = process.env.WHATSAPP_REMINDER_TEMPLATE?.trim() || "appointment_reminder";
    const templateLang = process.env.WHATSAPP_TEMPLATE_LANG?.trim() || "es";
    if (!token || !phoneNumberId) return { skipped: true, error: "omitido: proveedor no configurado" };
    const destination = e164Digits(to);
    if (!destination) return { error: "Número de WhatsApp inválido" };

    // Prefer approved utility templates for reminders outside the 24h window.
    const useTemplate = process.env.WHATSAPP_USE_TEMPLATE !== "0";
    const payload = useTemplate
      ? {
          messaging_product: "whatsapp",
          to: destination,
          type: "template",
          template: {
            name: templateName,
            language: { code: templateLang },
            components: [
              {
                type: "body",
                parameters: [{ type: "text", text: body.slice(0, 1024) }],
              },
            ],
          },
        }
      : {
          messaging_product: "whatsapp",
          to: destination,
          type: "text",
          text: { body: body.slice(0, 4096) },
        };

    const res = await fetch(`https://graph.facebook.com/v21.0/${encodeURIComponent(phoneNumberId)}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) return { error: "No se pudo enviar el WhatsApp de Meta" };
    const json = (await res.json().catch(() => null)) as { messages?: { id?: string }[] } | null;
    return { id: json?.messages?.[0]?.id, provider: "whatsapp-cloud" };
  },
};
