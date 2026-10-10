INSERT INTO message_templates (channel, template_key, locale, subject, body)
SELECT 'email', 'acceso', 'es', 'Tu código de Thrive Formative',
  'Hola,' || E'\n\n' || 'Tu código de acceso a Thrive Formative es:' || E'\n\n' || '{{codigo}}' || E'\n\n' || 'Caduca en unos minutos. Si no lo pediste, ignora este correo.'
WHERE NOT EXISTS (
  SELECT 1 FROM message_templates WHERE channel = 'email' AND template_key = 'acceso' AND locale = 'es'
);

INSERT INTO message_templates (channel, template_key, locale, subject, body)
SELECT 'email', 'acceso', 'en', 'Your Thrive Formative code',
  'Hello,' || E'\n\n' || 'Your Thrive Formative access code is:' || E'\n\n' || '{{codigo}}' || E'\n\n' || 'It expires in a few minutes. If you did not ask for it, ignore this email.'
WHERE NOT EXISTS (
  SELECT 1 FROM message_templates WHERE channel = 'email' AND template_key = 'acceso' AND locale = 'en'
);
