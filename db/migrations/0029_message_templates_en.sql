INSERT INTO message_templates (channel, template_key, locale, subject, body)
SELECT 'email', 'cita_creada', 'en', 'Thrive Formative — appointment booked',
  'Hello {{nombre}}, we booked your {{servicio}} appointment on {{fecha}} at {{hora}} at {{sede}} with {{profesional}}. Manage it here: {{enlace}}'
WHERE NOT EXISTS (
  SELECT 1 FROM message_templates WHERE channel = 'email' AND template_key = 'cita_creada' AND locale = 'en'
);

INSERT INTO message_templates (channel, template_key, locale, subject, body)
SELECT 'sms', 'cita_creada', 'en', NULL,
  'Thrive Formative: {{servicio}} appointment on {{fecha}} at {{hora}} at {{sede}}. Reply if you need to change it.'
WHERE NOT EXISTS (
  SELECT 1 FROM message_templates WHERE channel = 'sms' AND template_key = 'cita_creada' AND locale = 'en'
);

INSERT INTO message_templates (channel, template_key, locale, subject, body)
SELECT 'email', 'recordatorio', 'en', 'Thrive Formative — appointment reminder',
  'Hello {{nombre}}, this is a reminder of your {{servicio}} appointment on {{fecha}} at {{hora}} at {{sede}}.'
WHERE NOT EXISTS (
  SELECT 1 FROM message_templates WHERE channel = 'email' AND template_key = 'recordatorio' AND locale = 'en'
);

INSERT INTO message_templates (channel, template_key, locale, subject, body)
SELECT 'sms', 'recordatorio', 'en', NULL,
  'Thrive Formative reminder: {{servicio}} on {{fecha}} at {{hora}} at {{sede}}.'
WHERE NOT EXISTS (
  SELECT 1 FROM message_templates WHERE channel = 'sms' AND template_key = 'recordatorio' AND locale = 'en'
);

INSERT INTO message_templates (channel, template_key, locale, subject, body)
SELECT 'email', 'cancelacion', 'en', 'Thrive Formative — appointment cancelled',
  'Hello {{nombre}}, your appointment on {{fecha}} at {{hora}} was cancelled. You can book another time on the website.'
WHERE NOT EXISTS (
  SELECT 1 FROM message_templates WHERE channel = 'email' AND template_key = 'cancelacion' AND locale = 'en'
);
