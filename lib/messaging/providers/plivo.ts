import type { MessagingProvider, SendResult } from "@/lib/messaging/providers/types";

function e164(value: string) {
  const trimmed = value.trim();
  if (trimmed.startsWith("+")) return trimmed;
  const digits = trimmed.replace(/\D/g, "");
  return digits ? `+${digits}` : trimmed;
}

export const plivoSms: MessagingProvider = {
  name: "plivo-sms",
  async send(to, body): Promise<SendResult> {
    const authId = process.env.PLIVO_AUTH_ID?.trim();
    const authToken = process.env.PLIVO_AUTH_TOKEN?.trim();
    const from = process.env.PLIVO_FROM_NUMBER?.trim();
    if (!authId || !authToken || !from) return { skipped: true, error: "omitido: proveedor no configurado" };
    const auth = Buffer.from(`${authId}:${authToken}`).toString("base64");
    const res = await fetch(`https://api.plivo.com/v1/Account/${encodeURIComponent(authId)}/Message/`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        src: e164(from),
        dst: e164(to),
        text: body,
      }),
    });
    if (!res.ok) return { error: "No se pudo enviar el SMS de Plivo" };
    const json = (await res.json().catch(() => null)) as { message_uuid?: string[] } | null;
    return { id: json?.message_uuid?.[0], provider: "plivo" };
  },
};
