ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_channel_check;
ALTER TABLE messages ADD CONSTRAINT messages_channel_check
  CHECK (channel IN ('sms', 'whatsapp', 'imessage', 'email'));

ALTER TABLE message_templates DROP CONSTRAINT IF EXISTS message_templates_channel_check;
ALTER TABLE message_templates ADD CONSTRAINT message_templates_channel_check
  CHECK (channel IN ('sms', 'whatsapp', 'imessage', 'email'));

ALTER TABLE message_rules DROP CONSTRAINT IF EXISTS message_rules_channel_check;
ALTER TABLE message_rules ADD CONSTRAINT message_rules_channel_check
  CHECK (channel IN ('sms', 'whatsapp', 'imessage', 'email'));

ALTER TABLE patients
  ADD COLUMN IF NOT EXISTS sms_opt_out boolean NOT NULL DEFAULT false;

UPDATE message_templates
SET body = 'Hola {{nombre}}, te recordamos tu cita de {{servicio}} el {{fecha}} a las {{hora}} en {{sede}} ({{direccion}}). Confirma o reprograma aquí: {{enlace}}'
WHERE template_key = 'recordatorio' AND channel = 'email' AND locale = 'es';

UPDATE message_templates
SET body = 'Hello {{nombre}}, this is a reminder of your {{servicio}} appointment on {{fecha}} at {{hora}} at {{sede}} ({{direccion}}). Confirm or reschedule: {{enlace}}'
WHERE template_key = 'recordatorio' AND channel = 'email' AND locale = 'en';

UPDATE message_templates
SET body = 'Hola {{nombre}}, recordatorio Thrive Formative: {{servicio}} el {{fecha}} a las {{hora}} en {{sede}} ({{direccion}}). Confirma o cambia tu cita: {{enlace}}'
WHERE template_key = 'recordatorio' AND channel = 'sms' AND locale = 'es';

UPDATE message_templates
SET body = 'Hi {{nombre}}, Thrive Formative reminder: {{servicio}} on {{fecha}} at {{hora}} at {{sede}} ({{direccion}}). Confirm or reschedule: {{enlace}}'
WHERE template_key = 'recordatorio' AND channel = 'sms' AND locale = 'en';

INSERT INTO message_templates (channel, template_key, locale, subject, body, is_active)
SELECT 'whatsapp', 'recordatorio', 'es', NULL,
       'Hola {{nombre}}, recordatorio Thrive Formative: {{servicio}} el {{fecha}} a las {{hora}} en {{sede}} ({{direccion}}). Confirma o cambia tu cita: {{enlace}}',
       true
WHERE NOT EXISTS (
  SELECT 1 FROM message_templates WHERE channel = 'whatsapp' AND template_key = 'recordatorio' AND locale = 'es'
);

INSERT INTO message_templates (channel, template_key, locale, subject, body, is_active)
SELECT 'whatsapp', 'recordatorio', 'en', NULL,
       'Hi {{nombre}}, Thrive Formative reminder: {{servicio}} on {{fecha}} at {{hora}} at {{sede}} ({{direccion}}). Confirm or reschedule: {{enlace}}',
       true
WHERE NOT EXISTS (
  SELECT 1 FROM message_templates WHERE channel = 'whatsapp' AND template_key = 'recordatorio' AND locale = 'en'
);

INSERT INTO message_templates (channel, template_key, locale, subject, body, is_active)
SELECT 'imessage', 'recordatorio', 'es', NULL,
       'Hola {{nombre}}, recordatorio Thrive Formative: {{servicio}} el {{fecha}} a las {{hora}} en {{sede}} ({{direccion}}). Confirma o cambia tu cita: {{enlace}}',
       true
WHERE NOT EXISTS (
  SELECT 1 FROM message_templates WHERE channel = 'imessage' AND template_key = 'recordatorio' AND locale = 'es'
);

INSERT INTO message_templates (channel, template_key, locale, subject, body, is_active)
SELECT 'imessage', 'recordatorio', 'en', NULL,
       'Hi {{nombre}}, Thrive Formative reminder: {{servicio}} on {{fecha}} at {{hora}} at {{sede}} ({{direccion}}). Confirm or reschedule: {{enlace}}',
       true
WHERE NOT EXISTS (
  SELECT 1 FROM message_templates WHERE channel = 'imessage' AND template_key = 'recordatorio' AND locale = 'en'
);

INSERT INTO message_rules (trigger_key, offset_minutes, channel, template_id, is_active)
SELECT 'recordatorio', -4320, 'sms', t.id, true
FROM message_templates t
WHERE t.channel = 'sms' AND t.template_key = 'recordatorio' AND t.locale = 'es' AND t.is_active
  AND NOT EXISTS (
    SELECT 1 FROM message_rules r
    WHERE r.trigger_key = 'recordatorio' AND r.offset_minutes = -4320 AND r.channel = 'sms' AND r.template_id = t.id
  );

INSERT INTO message_rules (trigger_key, offset_minutes, channel, template_id, is_active)
SELECT 'recordatorio', -2880, 'sms', t.id, true
FROM message_templates t
WHERE t.channel = 'sms' AND t.template_key = 'recordatorio' AND t.locale = 'es' AND t.is_active
  AND NOT EXISTS (
    SELECT 1 FROM message_rules r
    WHERE r.trigger_key = 'recordatorio' AND r.offset_minutes = -2880 AND r.channel = 'sms' AND r.template_id = t.id
  );

INSERT INTO message_rules (trigger_key, offset_minutes, channel, template_id, is_active)
SELECT 'recordatorio', -1440, 'sms', t.id, true
FROM message_templates t
WHERE t.channel = 'sms' AND t.template_key = 'recordatorio' AND t.locale = 'es' AND t.is_active
  AND NOT EXISTS (
    SELECT 1 FROM message_rules r
    WHERE r.trigger_key = 'recordatorio' AND r.offset_minutes = -1440 AND r.channel = 'sms' AND r.template_id = t.id
  );

UPDATE message_rules r
SET is_active = true
FROM message_templates t
WHERE r.template_id = t.id
  AND r.trigger_key = 'recordatorio'
  AND r.channel = 'sms'
  AND r.offset_minutes IN (-4320, -2880, -1440)
  AND t.template_key = 'recordatorio';
