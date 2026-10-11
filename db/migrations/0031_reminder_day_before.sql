-- Correo de recordatorio un día antes (1440 minutos). Si la regla ya existe, se reactiva.
INSERT INTO message_rules (trigger_key, offset_minutes, channel, template_id, is_active)
SELECT 'recordatorio', -1440, 'email', t.id, true
FROM message_templates t
WHERE t.channel = 'email'
  AND t.template_key = 'recordatorio'
  AND t.locale = 'es'
  AND t.is_active
  AND NOT EXISTS (
    SELECT 1 FROM message_rules r
    WHERE r.trigger_key = 'recordatorio'
      AND r.offset_minutes = -1440
      AND r.channel = 'email'
      AND r.template_id = t.id
  );

UPDATE message_rules r
SET is_active = true
FROM message_templates t
WHERE r.template_id = t.id
  AND r.trigger_key = 'recordatorio'
  AND r.channel = 'email'
  AND r.offset_minutes = -1440
  AND t.template_key = 'recordatorio';
