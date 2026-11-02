import type { MessagingProvider } from "@/lib/messaging/providers/types";

export const sendblueImessage: MessagingProvider = {
  name: "sendblue",
  async send(to, body) {
    const key = process.env.SENDBLUE_API_KEY?.trim();
    const secret = process.env.SENDBLUE_API_SECRET?.trim() || key;
    if (!key) return { skipped: true, error: "omitido: proveedor no configurado" };
    const res = await fetch("https://api.sendblue.co/api/send-message", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "sb-api-key-id": key,
        "sb-api-secret-key": secret || "",
      },
      body: JSON.stringify({ number: to.startsWith("+") ? to : `+${to.replace(/\D/g, "")}`, content: body }),
    });
    if (!res.ok) return { error: "No se pudo enviar el iMessage" };
    const json = (await res.json()) as { message_handle?: string; accountEmail?: string };
    return { id: json.message_handle, provider: "sendblue" };
  },
};
