import { query } from "@/lib/db";
import { DomainError } from "@/lib/http";

export type MessagingSettings = {
  quietStart: number;
  quietEnd: number;
  smsProvider: string;
};

export type ReminderRuleView = {
  id: string;
  offsetMinutes: number;
  channel: string;
  isActive: boolean;
  templateId: string;
  label: string;
};

export type ReminderTemplateView = {
  id: string;
  channel: string;
  locale: string;
  subject: string | null;
  body: string;
  isActive: boolean;
};

const OFFSETS = [
  { offset: -4320, label: "3d" },
  { offset: -2880, label: "2d" },
  { offset: -1440, label: "24h" },
] as const;

export async function getMessagingSettings(): Promise<MessagingSettings> {
  const row = await query<{ value: MessagingSettings | string }>(
    `SELECT value FROM clinic_settings WHERE key = 'messaging_settings'`
  );
  const raw = row.rows[0]?.value;
  const value = typeof raw === "string" ? (JSON.parse(raw) as MessagingSettings) : raw || {};
  return {
    quietStart: Number.isFinite(Number(value.quietStart)) ? Number(value.quietStart) : 21,
    quietEnd: Number.isFinite(Number(value.quietEnd)) ? Number(value.quietEnd) : 8,
    smsProvider: String(value.smsProvider || process.env.SMS_PROVIDER || "telnyx"),
  };
}

export async function getReminderSettings() {
  const messaging = await getMessagingSettings();
  const rules = await query<{
    id: string;
    offset_minutes: number;
    channel: string;
    is_active: boolean;
    template_id: string;
  }>(
    `SELECT id, offset_minutes, channel, is_active, template_id
     FROM message_rules
     WHERE trigger_key = 'recordatorio' AND offset_minutes = ANY($1::int[])
     ORDER BY offset_minutes ASC`,
    [OFFSETS.map((item) => item.offset)]
  );
  const templates = await query<{
    id: string;
    channel: string;
    locale: string;
    subject: string | null;
    body: string;
    is_active: boolean;
  }>(
    `SELECT id, channel, locale, subject, body, is_active
     FROM message_templates
     WHERE template_key = 'recordatorio'
     ORDER BY channel, locale`
  );
  const byOffset = new Map(rules.rows.map((row) => [row.offset_minutes, row]));
  const reminderRules: ReminderRuleView[] = OFFSETS.map((item) => {
    const row = byOffset.get(item.offset);
    return {
      id: row?.id || "",
      offsetMinutes: item.offset,
      channel: row?.channel || "sms",
      isActive: row ? Boolean(row.is_active) : false,
      templateId: row?.template_id || "",
      label: item.label,
    };
  });
  return {
    messaging,
    rules: reminderRules,
    templates: templates.rows.map((row) => ({
      id: row.id,
      channel: row.channel,
      locale: row.locale,
      subject: row.subject,
      body: row.body,
      isActive: Boolean(row.is_active),
    })) as ReminderTemplateView[],
  };
}

export async function saveReminderSettings(input: {
  messaging?: Partial<MessagingSettings>;
  rules?: Array<{ offsetMinutes: number; channel?: string; isActive?: boolean }>;
  templates?: Array<{ id: string; subject?: string | null; body?: string; isActive?: boolean }>;
}) {
  if (input.messaging) {
    const current = await getMessagingSettings();
    const next = {
      quietStart: Number.isFinite(Number(input.messaging.quietStart))
        ? Math.max(0, Math.min(23, Number(input.messaging.quietStart)))
        : current.quietStart,
      quietEnd: Number.isFinite(Number(input.messaging.quietEnd))
        ? Math.max(0, Math.min(23, Number(input.messaging.quietEnd)))
        : current.quietEnd,
      smsProvider: String(input.messaging.smsProvider || current.smsProvider || "telnyx"),
    };
    await query(
      `INSERT INTO clinic_settings (key, value)
       VALUES ('messaging_settings', $1::jsonb)
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
      [JSON.stringify(next)]
    );
  }

  if (input.rules?.length) {
    for (const rule of input.rules) {
      if (!OFFSETS.some((item) => item.offset === rule.offsetMinutes)) {
        throw new DomainError("Offset de recordatorio no válido.");
      }
      const existing = await query<{ id: string; template_id: string }>(
        `SELECT id, template_id FROM message_rules
         WHERE trigger_key = 'recordatorio' AND offset_minutes = $1
         ORDER BY id ASC LIMIT 1`,
        [rule.offsetMinutes]
      );
      if (!existing.rows[0]) {
        const template = await query<{ id: string }>(
          `SELECT id FROM message_templates
           WHERE template_key = 'recordatorio' AND channel = $1 AND locale = 'es' AND is_active
           ORDER BY id ASC LIMIT 1`,
          [rule.channel || "sms"]
        );
        if (!template.rows[0]) throw new DomainError("Falta la plantilla de recordatorio.");
        await query(
          `INSERT INTO message_rules (trigger_key, offset_minutes, channel, template_id, is_active)
           VALUES ('recordatorio', $1, $2, $3, $4)`,
          [rule.offsetMinutes, rule.channel || "sms", template.rows[0].id, rule.isActive !== false]
        );
        continue;
      }
      await query(
        `UPDATE message_rules
         SET channel = COALESCE($2, channel),
             is_active = COALESCE($3, is_active)
         WHERE id = $1`,
        [
          existing.rows[0].id,
          rule.channel || null,
          typeof rule.isActive === "boolean" ? rule.isActive : null,
        ]
      );
    }
  }

  if (input.templates?.length) {
    for (const template of input.templates) {
      if (!template.id) continue;
      await query(
        `UPDATE message_templates
         SET subject = COALESCE($2, subject),
             body = COALESCE($3, body),
             is_active = COALESCE($4, is_active)
         WHERE id = $1 AND template_key = 'recordatorio'`,
        [
          template.id,
          template.subject === undefined ? null : template.subject,
          template.body === undefined ? null : template.body,
          typeof template.isActive === "boolean" ? template.isActive : null,
        ]
      );
    }
  }

  return getReminderSettings();
}
