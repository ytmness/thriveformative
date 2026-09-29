INSERT INTO roles (key, name, is_system) VALUES
  ('admin', 'Administrador', true),
  ('doctor', 'Médico', true),
  ('reception', 'Recepción', true);

INSERT INTO permissions (key, module, action) VALUES
  ('dashboard.read', 'dashboard', 'read'),
  ('patients.read', 'patients', 'read'),
  ('patients.write', 'patients', 'write'),
  ('leads.read', 'leads', 'read'),
  ('leads.write', 'leads', 'write'),
  ('appointments.read', 'appointments', 'read'),
  ('appointments.write', 'appointments', 'write'),
  ('clinical.read', 'clinical', 'read'),
  ('clinical.write', 'clinical', 'write'),
  ('forms.read', 'forms', 'read'),
  ('forms.write', 'forms', 'write'),
  ('sales.read', 'sales', 'read'),
  ('sales.write', 'sales', 'write'),
  ('sales.refund', 'sales', 'refund'),
  ('invoices.read', 'invoices', 'read'),
  ('invoices.write', 'invoices', 'write'),
  ('inventory.read', 'inventory', 'read'),
  ('inventory.write', 'inventory', 'write'),
  ('communications.read', 'communications', 'read'),
  ('communications.write', 'communications', 'write'),
  ('reports.read', 'reports', 'read'),
  ('settings.read', 'settings', 'read'),
  ('settings.write', 'settings', 'write'),
  ('audit.read', 'audit', 'read'),
  ('api.manage', 'api', 'manage');

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p WHERE r.key = 'admin';

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.key IN (
  'dashboard.read', 'patients.read', 'appointments.read', 'appointments.write',
  'clinical.read', 'clinical.write', 'forms.read', 'forms.write', 'reports.read'
)
WHERE r.key = 'doctor';

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.key IN (
  'dashboard.read', 'patients.read', 'patients.write', 'leads.read', 'leads.write',
  'appointments.read', 'appointments.write', 'forms.read', 'sales.read', 'sales.write',
  'invoices.read', 'invoices.write', 'communications.read', 'inventory.read'
)
WHERE r.key = 'reception';

INSERT INTO locations (name, timezone, city, state, country)
VALUES ('Thrive Formative', 'America/Chicago', 'Laredo', 'TX', 'US');

INSERT INTO taxes (name, rate, is_default, is_active) VALUES
  ('Exento', 0, true, true),
  ('Sales tax', 8.2500, false, true);

INSERT INTO payment_methods (key, name, sort_order) VALUES
  ('cash', 'Efectivo', 1),
  ('card', 'Tarjeta', 2),
  ('transfer', 'Transferencia', 3),
  ('stripe', 'Stripe', 4),
  ('gift_card', 'Tarjeta de regalo', 5),
  ('account_credit', 'Abono a cuenta', 6);

INSERT INTO booking_settings (id) VALUES (1);

INSERT INTO clinic_settings (key, value) VALUES
  ('cancellation_policy', '{"text":"Las citas pueden cancelarse o reprogramarse hasta 24 horas antes. Pasado ese plazo la clínica puede registrar la cita como no-show."}'::jsonb),
  ('invoice_footer', '{"text":"Thrive Formative — Medicina familiar y funcional."}'::jsonb),
  ('privacy_notice', '{"text":"La información de salud se usa solo para tu atención. Puedes pedir acceso o corrección de tu expediente en recepción."}'::jsonb);

INSERT INTO marketing_sources (name) VALUES
  ('Sitio web'), ('Referido'), ('Instagram'), ('Google'), ('Otro');

INSERT INTO lead_stages (name, sort_order, is_won, is_lost) VALUES
  ('Nuevo', 1, false, false),
  ('Contactado', 2, false, false),
  ('Cita agendada', 3, false, false),
  ('Ganado', 4, true, false),
  ('Perdido', 5, false, true);

INSERT INTO service_categories (name, sort_order)
VALUES ('Medicina funcional', 1);

INSERT INTO services (category_id, name, description, duration_minutes, price, is_online_bookable)
SELECT id, 'Consulta inicial', 'Primera valoración con el equipo clínico.', 60, 150, true
FROM service_categories WHERE name = 'Medicina funcional';

INSERT INTO rooms (location_id, name)
SELECT id, 'Consultorio 1' FROM locations WHERE name = 'Thrive Formative';

INSERT INTO service_locations (service_id, location_id)
SELECT s.id, l.id FROM services s CROSS JOIN locations l
WHERE s.name = 'Consulta inicial';

INSERT INTO service_rooms (service_id, room_id)
SELECT s.id, r.id FROM services s JOIN rooms r ON r.name = 'Consultorio 1'
WHERE s.name = 'Consulta inicial';

INSERT INTO message_templates (channel, template_key, locale, subject, body) VALUES
  ('email', 'cita_creada', 'es', 'Thrive Formative — cita registrada',
   'Hola {{nombre}}, registramos tu cita de {{servicio}} el {{fecha}} a las {{hora}} en {{sede}} con {{profesional}}. Administra tu cita aquí: {{enlace}}'),
  ('sms', 'cita_creada', 'es', NULL,
   'Thrive Formative: cita de {{servicio}} el {{fecha}} a las {{hora}} en {{sede}}. Responde si necesitas cambiarla.'),
  ('email', 'recordatorio', 'es', 'Thrive Formative — recordatorio de cita',
   'Hola {{nombre}}, te recordamos tu cita de {{servicio}} el {{fecha}} a las {{hora}} en {{sede}}.'),
  ('sms', 'recordatorio', 'es', NULL,
   'Recordatorio Thrive Formative: {{servicio}} el {{fecha}} a las {{hora}} en {{sede}}.'),
  ('email', 'cancelacion', 'es', 'Thrive Formative — cita cancelada',
   'Hola {{nombre}}, tu cita del {{fecha}} a las {{hora}} quedó cancelada. Puedes reservar otro horario en el sitio.');

INSERT INTO message_rules (trigger_key, offset_minutes, channel, template_id, is_active)
SELECT 'cita_creada', 0, t.channel, t.id, true
FROM message_templates t WHERE t.template_key = 'cita_creada';

INSERT INTO message_rules (trigger_key, offset_minutes, channel, template_id, is_active)
SELECT 'recordatorio', -1440, t.channel, t.id, true
FROM message_templates t WHERE t.template_key = 'recordatorio';

INSERT INTO message_rules (trigger_key, offset_minutes, channel, template_id, is_active)
SELECT 'recordatorio', -120, 'sms', t.id, true
FROM message_templates t WHERE t.template_key = 'recordatorio' AND t.channel = 'sms';

INSERT INTO message_rules (trigger_key, offset_minutes, channel, template_id, is_active)
SELECT 'cancelacion', 0, 'email', t.id, true
FROM message_templates t WHERE t.template_key = 'cancelacion';
