export type TextChannel = "sms" | "whatsapp" | "imessage";

export type SendResult =
  | { skipped: true; error: string }
  | { error: string; skipped?: false }
  | { id?: string; provider: string; error?: undefined; skipped?: false };

export type MessagingProvider = {
  name: string;
  send(to: string, body: string, channel: TextChannel): Promise<SendResult>;
};
