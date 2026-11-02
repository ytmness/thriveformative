import type { MessagingProvider, SendResult } from "@/lib/messaging/providers/types";

function twilioFromNumber() {
  return process.env.TWILIO_FROM_NUMBER?.trim() || process.env.TWILIO_FROM?.trim() || "";
}

function e164(value: string) {
  const trimmed = value.replace(/^whatsapp:/i, "").trim();
  if (trimmed.startsWith("+")) return trimmed;
  const digits = trimmed.replace(/\D/g, "");
  return digits ? `+${digits}` : trimmed;
}

async function twilioSend(to: string, from: string, body: string): Promise<SendResult> {
  const sid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const token = process.env.TWILIO_AUTH_TOKEN?.trim();
  if (!sid || !token || !from) return { skipped: true, error: "omitido: proveedor no configurado" };
  const auth = Buffer.from(`${sid}:${token}`).toString("base64");
  const form = new URLSearchParams({ To: to, From: from, Body: body });
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: "POST",
    headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: form,
  });
  if (!res.ok) return { error: "No se pudo enviar el mensaje de Twilio" };
  const json = (await res.json()) as { sid?: string };
  return { id: json.sid, provider: "twilio" };
}

export const twilioSms: MessagingProvider = {
  name: "twilio-sms",
  async send(to, body) {
    return twilioSend(e164(to), twilioFromNumber(), body);
  },
};

export const twilioWhatsapp: MessagingProvider = {
  name: "twilio-whatsapp",
  async send(to, body) {
    const from = process.env.TWILIO_WHATSAPP_FROM?.trim();
    if (!from) return { skipped: true, error: "omitido: proveedor no configurado" };
    const dest = to.startsWith("whatsapp:") ? to : `whatsapp:${e164(to)}`;
    const origin = from.startsWith("whatsapp:") ? from : `whatsapp:${e164(from)}`;
    return twilioSend(dest, origin, body);
  },
};

