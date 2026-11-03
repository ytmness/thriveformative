import { sendblueImessage } from "@/lib/messaging/providers/sendblue";
import { telnyxSms } from "@/lib/messaging/providers/telnyx";
import { plivoSms } from "@/lib/messaging/providers/plivo";
import { twilioSms, twilioWhatsapp } from "@/lib/messaging/providers/twilio";
import { whatsappCloud } from "@/lib/messaging/providers/whatsappCloud";
import type { MessagingProvider, SendResult, TextChannel } from "@/lib/messaging/providers/types";

export type { MessagingProvider, SendResult, TextChannel } from "@/lib/messaging/providers/types";

function smsProviderName() {
  return (process.env.SMS_PROVIDER || "telnyx").trim().toLowerCase();
}

export function providerFor(channel: TextChannel): MessagingProvider {
  if (channel === "whatsapp") {
    if (process.env.WHATSAPP_TOKEN?.trim() && process.env.WHATSAPP_PHONE_NUMBER_ID?.trim()) {
      return whatsappCloud;
    }
    // Twilio WhatsApp kept as disabled fallback only when explicitly selected.
    if (smsProviderName() === "twilio") return twilioWhatsapp;
    return whatsappCloud;
  }
  if (channel === "imessage") return sendblueImessage;
  const provider = smsProviderName();
  if (provider === "plivo") return plivoSms;
  if (provider === "twilio") return twilioSms;
  return telnyxSms;
}

export async function sendText(to: string, body: string, channel: TextChannel): Promise<SendResult> {
  return providerFor(channel).send(to, body, channel);
}
