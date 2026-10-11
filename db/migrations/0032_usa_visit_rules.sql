ALTER TABLE services
  ADD COLUMN IF NOT EXISTS min_days_between int NOT NULL DEFAULT 0 CHECK (min_days_between >= 0),
  ADD COLUMN IF NOT EXISTS max_per_patient int CHECK (max_per_patient IS NULL OR max_per_patient > 0),
  ADD COLUMN IF NOT EXISTS max_per_day int CHECK (max_per_day IS NULL OR max_per_day > 0);

-- 3 horas de consulta + 1 hora de descanso: si empieza a las 10:00, el siguiente hueco es a las 14:00.
UPDATE services
SET buffer_after_minutes = 60
WHERE name = 'Founders Price 90 Days Thrive Formative Method';

INSERT INTO services (
  category_id, name, description, duration_minutes,
  buffer_before_minutes, buffer_after_minutes, price, is_online_bookable,
  min_days_between, max_per_patient, max_per_day
)
SELECT
  COALESCE(
    (SELECT category_id FROM services WHERE name = 'Founders Price 90 Days Thrive Formative Method' LIMIT 1),
    (SELECT id FROM service_categories ORDER BY sort_order, name LIMIT 1)
  ),
  v.name,
  v.description,
  v.duration_minutes,
  0,
  0,
  0,
  true,
  v.min_days_between,
  v.max_per_patient,
  v.max_per_day
FROM (
  VALUES
    (
      'Initial appointment',
      'First visit of the 90-day plan. Three hours, one new patient per day, and only once per client.',
      180::int,
      0::int,
      1::int,
      1::int
    ),
    (
      'Follow-up visit',
      'One-hour visit every 2 weeks during the 90-day plan. Up to 6 visits per client.',
      60::int,
      14::int,
      6::int,
      NULL::int
    ),
    (
      'ShapeScale',
      '20-minute ShapeScale visit, once every 30 days per client.',
      20::int,
      30::int,
      NULL::int,
      NULL::int
    ),
    (
      'Epigenetic study',
      '20-minute epigenetic study, once every 90 days per client.',
      20::int,
      90::int,
      NULL::int,
      NULL::int
    )
) AS v(name, description, duration_minutes, min_days_between, max_per_patient, max_per_day)
WHERE NOT EXISTS (SELECT 1 FROM services s WHERE s.name = v.name);

INSERT INTO service_locations (service_id, location_id)
SELECT s.id, l.id
FROM services s
JOIN locations l
  ON l.is_active
 AND upper(l.country) IN ('US', 'USA', 'UNITED STATES', 'ESTADOS UNIDOS')
WHERE s.name IN ('Initial appointment', 'Follow-up visit', 'ShapeScale', 'Epigenetic study')
ON CONFLICT DO NOTHING;
