-- USA brochure: continuing membership + a-la-carte established-client services.

UPDATE memberships
SET description = 'Founders price $1,850 (first 100). Regular $5,950. Includes the Founders session, six follow-ups, three ShapeScale analyses, and one epigenetic study over 90 days.'
WHERE name = '90 Days Thrive Formative Method';

INSERT INTO memberships (name, price, interval_unit, description, is_active)
SELECT
  'Continuing Wellness Program',
  499,
  'month',
  '12-month continuity after the 90-day method. $499 per month. Includes one ShapeScale analysis and one monthly wellness follow-up, plus ongoing direct support. 10–20% savings on eligible products. One complimentary epigenetic assessment at year end (arranged with the team).',
  true
WHERE NOT EXISTS (
  SELECT 1 FROM memberships WHERE name = 'Continuing Wellness Program'
);

INSERT INTO services (
  category_id, name, description, duration_minutes,
  buffer_before_minutes, buffer_after_minutes, price, is_online_bookable,
  min_days_between, max_per_patient, max_per_day, requires_membership
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
  v.price,
  true,
  v.min_days_between,
  NULL,
  NULL,
  v.requires_membership
FROM (
  VALUES
    (
      'Monthly wellness follow-up',
      'One-hour personalized wellness follow-up in the Continuing Wellness Program. Once every 30 days.',
      60::int,
      0::numeric,
      30::int,
      true
    ),
    (
      'Quarterly Epigenetic Wellness Assessment',
      'Purchased separately by established clients. Includes personalized, lifestyle-focused interpretation.',
      20::int,
      355::numeric,
      90::int,
      false
    ),
    (
      'Additional ShapeScale 3D Progress Analysis',
      'Extra ShapeScale analysis for established clients when more visual progress tracking is needed.',
      20::int,
      75::numeric,
      0::int,
      false
    ),
    (
      'Additional Personalized Guidance',
      'One extra hour of personalized guidance. Not included in program pricing.',
      60::int,
      245::numeric,
      0::int,
      false
    )
) AS v(name, description, duration_minutes, price, min_days_between, requires_membership)
WHERE NOT EXISTS (SELECT 1 FROM services s WHERE s.name = v.name);

INSERT INTO service_locations (service_id, location_id)
SELECT s.id, l.id
FROM services s
JOIN locations l
  ON l.is_active
 AND upper(l.country) IN ('US', 'USA', 'UNITED STATES', 'ESTADOS UNIDOS')
WHERE s.name IN (
  'Monthly wellness follow-up',
  'Quarterly Epigenetic Wellness Assessment',
  'Additional ShapeScale 3D Progress Analysis',
  'Additional Personalized Guidance'
)
ON CONFLICT DO NOTHING;

INSERT INTO membership_items (membership_id, service_id, quantity)
SELECT m.id, s.id, v.quantity
FROM memberships m
JOIN (
  VALUES
    ('ShapeScale', 1),
    ('Monthly wellness follow-up', 1)
) AS v(service_name, quantity) ON true
JOIN services s ON s.name = v.service_name AND s.is_active
WHERE m.name = 'Continuing Wellness Program'
ON CONFLICT (membership_id, service_id) DO UPDATE SET quantity = EXCLUDED.quantity;
