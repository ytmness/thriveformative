-- Datos de demostración: 2 sedes en México y 2 en Estados Unidos.
-- Se puede correr otra vez: borra y vuelve a crear solo lo marcado como demo.

BEGIN;

UPDATE locations
SET name = 'Laredo',
    timezone = 'America/Chicago',
    city = 'Laredo',
    state = 'TX',
    country = 'US',
    is_active = true
WHERE name IN ('Thrive Formative', 'Laredo');

INSERT INTO locations (name, timezone, street, city, state, country, phone)
SELECT 'Austin', 'America/Chicago', '1200 S Congress Ave', 'Austin', 'TX', 'US', '+1 512 555 0142'
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE name = 'Austin' AND country = 'US');

INSERT INTO locations (name, timezone, street, city, state, country, phone)
SELECT 'San Pedro', 'America/Monterrey', 'Av. Gómez Morín 100', 'San Pedro Garza García', 'NL', 'MX', '+52 81 555 0142'
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE name = 'San Pedro' AND country = 'MX');

INSERT INTO locations (name, timezone, street, city, state, country, phone)
SELECT 'Monterrey', 'America/Monterrey', 'Calzada del Valle 400', 'Monterrey', 'NL', 'MX', '+52 81 555 0190'
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE name = 'Monterrey' AND country = 'MX');

INSERT INTO rooms (location_id, name)
SELECT l.id, 'Consultorio 1'
FROM locations l
WHERE l.name IN ('Laredo', 'Austin', 'San Pedro', 'Monterrey')
  AND NOT EXISTS (SELECT 1 FROM rooms r WHERE r.location_id = l.id AND r.name = 'Consultorio 1');

INSERT INTO service_categories (name, sort_order)
SELECT 'Medicina funcional', 1
WHERE NOT EXISTS (SELECT 1 FROM service_categories WHERE name = 'Medicina funcional');

INSERT INTO services (category_id, name, description, duration_minutes, price, is_online_bookable)
SELECT c.id, s.name, s.description, s.duration_minutes, s.price, true
FROM service_categories c
JOIN (VALUES
  ('Seguimiento mensual', 'Revisión de hábitos, labs y ajuste del plan.', 45, 90),
  ('Lectura de laboratorios', 'Lectura funcional de biomarcadores.', 40, 80),
  ('Plan de hábitos', 'Sesión para armar el plan de alimentación, sueño y movimiento.', 60, 220)
) AS s(name, description, duration_minutes, price) ON true
WHERE c.name = 'Medicina funcional'
  AND NOT EXISTS (SELECT 1 FROM services existing WHERE existing.name = s.name);

INSERT INTO service_locations (service_id, location_id)
SELECT s.id, l.id
FROM services s
JOIN locations l ON l.name IN ('Laredo', 'Austin', 'San Pedro', 'Monterrey')
WHERE s.name IN ('Consulta inicial', 'Seguimiento mensual', 'Lectura de laboratorios', 'Plan de hábitos')
ON CONFLICT DO NOTHING;

INSERT INTO staff_users (email, email_normalized, password_hash, first_name, last_name, job_title, is_bookable, default_location_id)
SELECT 'demo.clinica@thriveformative.com', 'demo.clinica@thriveformative.com', u.password_hash, 'Andrea', 'Solís', 'Médico', true,
       (SELECT id FROM locations WHERE name = 'San Pedro' AND country = 'MX' LIMIT 1)
FROM staff_users u
WHERE u.is_active
ORDER BY u.created_at
LIMIT 1
ON CONFLICT (email_normalized) DO UPDATE
SET is_active = true, is_bookable = true, first_name = EXCLUDED.first_name, last_name = EXCLUDED.last_name;

DELETE FROM payments WHERE sale_id IN (SELECT id FROM sales WHERE sale_number LIKE 'DEMO-%');
DELETE FROM sale_items WHERE sale_id IN (SELECT id FROM sales WHERE sale_number LIKE 'DEMO-%');
DELETE FROM invoices WHERE sale_id IN (SELECT id FROM sales WHERE sale_number LIKE 'DEMO-%');
DELETE FROM sales WHERE sale_number LIKE 'DEMO-%';
DELETE FROM appointments WHERE notes = 'demo-sede';
DELETE FROM leads WHERE referred_by_name = 'demo-sede';
DELETE FROM stock_movements WHERE product_id IN (SELECT id FROM products WHERE sku LIKE 'DEMO-%');
DELETE FROM product_stock WHERE product_id IN (SELECT id FROM products WHERE sku LIKE 'DEMO-%');
DELETE FROM products WHERE sku LIKE 'DEMO-%';

INSERT INTO product_categories (name, sort_order)
SELECT 'Suplementos', 1
WHERE NOT EXISTS (SELECT 1 FROM product_categories WHERE name = 'Suplementos');

INSERT INTO products (category_id, name, sku, description, cost, price, tax_id)
SELECT c.id, p.name, p.sku, p.description, p.cost, p.price, (SELECT id FROM taxes WHERE name = 'Sales tax' LIMIT 1)
FROM product_categories c
JOIN (VALUES
  ('Omega-3', 'DEMO-OM3', 'Aceite de pescado concentrado.', 14, 32),
  ('Vitamina D3', 'DEMO-D3', 'Colecalciferol 5000 UI.', 6, 18),
  ('Magnesio', 'DEMO-MG', 'Glicinato de magnesio.', 8, 22),
  ('Proteína', 'DEMO-PRO', 'Proteína de suero sin sabor.', 24, 48),
  ('Probiótico', 'DEMO-PB', 'Mezcla de cepas para microbiota.', 12, 28)
) AS p(name, sku, description, cost, price) ON true
WHERE c.name = 'Suplementos';

INSERT INTO product_stock (product_id, location_id, quantity, min_stock)
SELECT p.id, l.id, stock.quantity, 4
FROM products p
JOIN locations l ON l.name IN ('Laredo', 'Austin', 'San Pedro', 'Monterrey')
JOIN (VALUES
  ('DEMO-OM3', 'Laredo', 12), ('DEMO-OM3', 'Austin', 6), ('DEMO-OM3', 'San Pedro', 22), ('DEMO-OM3', 'Monterrey', 9),
  ('DEMO-D3', 'Laredo', 4), ('DEMO-D3', 'Austin', 18), ('DEMO-D3', 'San Pedro', 7), ('DEMO-D3', 'Monterrey', 13),
  ('DEMO-MG', 'Laredo', 20), ('DEMO-MG', 'Austin', 3), ('DEMO-MG', 'San Pedro', 14), ('DEMO-MG', 'Monterrey', 2),
  ('DEMO-PRO', 'Laredo', 8), ('DEMO-PRO', 'Austin', 11), ('DEMO-PRO', 'San Pedro', 5), ('DEMO-PRO', 'Monterrey', 19),
  ('DEMO-PB', 'Laredo', 15), ('DEMO-PB', 'Austin', 9), ('DEMO-PB', 'San Pedro', 16), ('DEMO-PB', 'Monterrey', 10)
) AS stock(sku, location_name, quantity) ON stock.sku = p.sku AND stock.location_name = l.name;

INSERT INTO patients (client_code, location_id, first_name, last_name, sex, city, state, country, preferred_language, referred_by_name)
SELECT v.code, l.id, v.first_name, v.last_name, v.sex, l.city, l.state, l.country, v.lang, 'demo-sede'
FROM (VALUES
  ('DEMO-LAR-01', 'Laredo', 'Sofía', 'Herrera', 'femenino', 'es'),
  ('DEMO-LAR-02', 'Laredo', 'Miguel', 'Treviño', 'masculino', 'es'),
  ('DEMO-LAR-03', 'Laredo', 'Emma', 'Castillo', 'femenino', 'en'),
  ('DEMO-AUS-01', 'Austin', 'James', 'Porter', 'masculino', 'en'),
  ('DEMO-AUS-02', 'Austin', 'Lucía', 'Nguyen', 'femenino', 'es'),
  ('DEMO-AUS-03', 'Austin', 'Olivia', 'Brooks', 'femenino', 'en'),
  ('DEMO-SP-01', 'San Pedro', 'Mariana', 'Elizondo', 'femenino', 'es'),
  ('DEMO-SP-02', 'San Pedro', 'Rodrigo', 'Salinas', 'masculino', 'es'),
  ('DEMO-SP-03', 'San Pedro', 'Paola', 'Cantú', 'femenino', 'es'),
  ('DEMO-MTY-01', 'Monterrey', 'Diego', 'Garza', 'masculino', 'es'),
  ('DEMO-MTY-02', 'Monterrey', 'Fernanda', 'Ríos', 'femenino', 'es'),
  ('DEMO-MTY-03', 'Monterrey', 'Héctor', 'Morales', 'masculino', 'es')
) AS v(code, location_name, first_name, last_name, sex, lang)
JOIN locations l ON l.name = v.location_name
ON CONFLICT (client_code) DO UPDATE
SET location_id = EXCLUDED.location_id,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    city = EXCLUDED.city,
    state = EXCLUDED.state,
    country = EXCLUDED.country,
    deleted_at = NULL;

INSERT INTO leads (location_id, stage_id, status, first_name, last_name, city, state, country, preferred_language, referred_by_name, estimated_value)
SELECT l.id, (SELECT id FROM lead_stages WHERE name = 'Nuevo' ORDER BY sort_order LIMIT 1), 'open',
       v.first_name, v.last_name, l.city, l.state, l.country, 'es', 'demo-sede', v.value
FROM (VALUES
  ('San Pedro', 'Valeria', 'Gómez', 180),
  ('Monterrey', 'Andrés', 'Peña', 150),
  ('Laredo', 'Chris', 'Delgado', 200),
  ('Austin', 'Hannah', 'Kim', 240)
) AS v(location_name, first_name, last_name, value)
JOIN locations l ON l.name = v.location_name;

DO $$
DECLARE
  staff_id uuid;
  rec record;
  start_at timestamptz;
  day_offset int;
  status text;
BEGIN
  SELECT id INTO staff_id FROM staff_users WHERE email_normalized = 'demo.clinica@thriveformative.com' LIMIT 1;
  IF staff_id IS NULL THEN
    RAISE EXCEPTION 'No hay médico demo';
  END IF;

  FOR rec IN
    SELECT l.id AS location_id, l.name,
           (SELECT id FROM rooms r WHERE r.location_id = l.id ORDER BY r.created_at LIMIT 1) AS room_id,
           CASE l.name WHEN 'Laredo' THEN 8 WHEN 'Austin' THEN 10 WHEN 'San Pedro' THEN 13 ELSE 15 END AS hour
    FROM locations l
    WHERE l.name IN ('Laredo', 'Austin', 'San Pedro', 'Monterrey')
  LOOP
    FOREACH day_offset IN ARRAY ARRAY[-1, 0, 1]
    LOOP
      start_at := ((date_trunc('day', timezone('America/Chicago', now())) + make_interval(days => day_offset, hours => rec.hour)) AT TIME ZONE 'America/Chicago');
      status := CASE WHEN day_offset < 0 THEN 'completed' WHEN day_offset = 0 THEN 'confirmed' ELSE 'booked' END;
      BEGIN
        INSERT INTO appointments (
          patient_id, service_id, staff_user_id, location_id, room_id,
          starts_at, ends_at, duration_minutes, status, price, notes
        )
        SELECT
          (SELECT id FROM patients p WHERE p.location_id = rec.location_id AND p.referred_by_name = 'demo-sede' ORDER BY p.client_code LIMIT 1),
          (SELECT id FROM services WHERE name = CASE rec.name
             WHEN 'San Pedro' THEN 'Consulta inicial'
             WHEN 'Monterrey' THEN 'Seguimiento mensual'
             WHEN 'Laredo' THEN 'Lectura de laboratorios'
             ELSE 'Plan de hábitos' END LIMIT 1),
          staff_id, rec.location_id, rec.room_id,
          start_at, start_at + interval '50 minutes', 50, status, 150, 'demo-sede';
      EXCEPTION WHEN exclusion_violation THEN
        NULL;
      END;
    END LOOP;
  END LOOP;
END $$;

INSERT INTO sales (sale_number, patient_id, location_id, staff_user_id, status, subtotal, tax_total, total, paid_total, balance, notes, created_at)
SELECT v.number,
       (SELECT id FROM patients p WHERE p.client_code = v.code),
       l.id,
       (SELECT id FROM staff_users WHERE email_normalized = 'demo.clinica@thriveformative.com'),
       'paid', v.amount, 0, v.amount, v.amount, 0, 'demo-sede', now()
FROM (VALUES
  ('DEMO-S-LAR', 'DEMO-LAR-01', 'Laredo', 186),
  ('DEMO-S-AUS', 'DEMO-AUS-01', 'Austin', 240),
  ('DEMO-S-SP', 'DEMO-SP-01', 'San Pedro', 150),
  ('DEMO-S-MTY', 'DEMO-MTY-01', 'Monterrey', 320)
) AS v(number, code, location_name, amount)
JOIN locations l ON l.name = v.location_name;

INSERT INTO sale_items (sale_id, item_type, description, quantity, unit_price, line_total, staff_user_id)
SELECT s.id, 'service', 'Consulta en ' || l.name, 1, s.total, s.total, s.staff_user_id
FROM sales s
JOIN locations l ON l.id = s.location_id
WHERE s.sale_number LIKE 'DEMO-%';

INSERT INTO payments (sale_id, patient_id, method_id, amount, status, received_at, created_by)
SELECT s.id, s.patient_id, (SELECT id FROM payment_methods WHERE key = 'card' LIMIT 1), s.total, 'succeeded', now(), s.staff_user_id
FROM sales s
WHERE s.sale_number LIKE 'DEMO-%';

COMMIT;
