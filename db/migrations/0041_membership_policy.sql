ALTER TABLE patients
  ADD COLUMN IF NOT EXISTS membership_override boolean NOT NULL DEFAULT false;

ALTER TABLE memberships
  ADD COLUMN IF NOT EXISTS auto_renew boolean NOT NULL DEFAULT false;

ALTER TABLE patient_memberships
  ADD COLUMN IF NOT EXISTS last_expiry_notice_on date;

INSERT INTO clinic_settings (key, value)
VALUES ('membership_policy', '{"graceDays":3,"noticeDays":7}'::jsonb)
ON CONFLICT (key) DO NOTHING;

INSERT INTO message_templates (channel, template_key, locale, subject, body, is_active)
SELECT 'email', 'membresia_vence', 'es',
       'Tu plan vence pronto',
       'Hola {{nombre}}, tu membresía vence el {{fecha}}. Renueva aquí: {{enlace}}',
       true
WHERE NOT EXISTS (
  SELECT 1 FROM message_templates WHERE channel = 'email' AND template_key = 'membresia_vence' AND locale = 'es'
);

INSERT INTO message_templates (channel, template_key, locale, subject, body, is_active)
SELECT 'email', 'membresia_vence', 'en',
       'Your plan is ending soon',
       'Hi {{nombre}}, your membership ends on {{fecha}}. Renew here: {{enlace}}',
       true
WHERE NOT EXISTS (
  SELECT 1 FROM message_templates WHERE channel = 'email' AND template_key = 'membresia_vence' AND locale = 'en'
);
