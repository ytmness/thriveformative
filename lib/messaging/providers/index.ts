import { sendblueImessage } from "@/lib/messaging/providers/sendblue";
import { twilioSms, twilioWhatsapp } from "@/lib/messaging/providers/twilio";
import type { MessagingProvider, SendResult, TextChannel } from "@/lib/messaging/providers/types";

export type { MessagingProvider, SendResult, TextChannel } from "@/lib/messaging/providers/types";

export function providerFor(channel: TextChannel): MessagingProvider {
  if (channel === "whatsapp") return twilioWhatsapp;
  if (channel === "imessage") return sendblueImessage;
  return twilioSms;
}

export async function sendText(to: string, body: string, channel: TextChannel): Promise<SendResult> {
  return providerFor(channel).send(to, body, channel);
}
