import type { MessagingProvider, SendResult } from "@/lib/messaging/providers/types";

function e164(value: string) {
  const trimmed = value.trim();
  if (trimmed.startsWith("+")) return trimmed;
  const digits = trimmed.replace(/\D/g, "");
  return digits ? `+${digits}` : trimmed;
}

export const telnyxSms: MessagingProvider = {
  name: "telnyx-sms",
  async send(to, body): Promise<SendResult> {
    const apiKey = process.env.TELNYX_API_KEY?.trim();
    const from = process.env.TELNYX_FROM_NUMBER?.trim();
    const profileId = process.env.TELNYX_MESSAGING_PROFILE_ID?.trim();
    if (!apiKey || !from) return { skipped: true, error: "omitido: proveedor no configurado" };
    const payload: Record<string, unknown> = {
      from: e164(from),
      to: e164(to),
      text: body,
    };
    if (profileId) payload.messaging_profile_id = profileId;
    const res = await fetch("https://api.telnyx.com/v2/messages", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) return { error: "No se pudo enviar el SMS de Telnyx" };
    const json = (await res.json().catch(() => null)) as { data?: { id?: string } } | null;
    return { id: json?.data?.id, provider: "telnyx" };
  },
};
