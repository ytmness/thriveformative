-- La cita larga de 90 días cubre consulta inicial + ShapeScale 1 + epigenético 1.
-- Mañana 3 h; seguimientos de 4 h por la tarde. El reloj de 90 días arranca en esa primera visita.

ALTER TABLE services
  ADD COLUMN IF NOT EXISTS slot_window_start time,
  ADD COLUMN IF NOT EXISTS slot_window_end time;

CREATE TABLE IF NOT EXISTS service_bundles (
  parent_service_id uuid NOT NULL REFERENCES services (id) ON DELETE CASCADE,
  bundled_service_id uuid NOT NULL REFERENCES services (id) ON DELETE CASCADE,
  PRIMARY KEY (parent_service_id, bundled_service_id),
  CHECK (parent_service_id <> bundled_service_id)
);

CREATE TABLE IF NOT EXISTS appointment_services (
  appointment_id uuid NOT NULL REFERENCES appointments (id) ON DELETE CASCADE,
  service_id uuid NOT NULL REFERENCES services (id) ON DELETE CASCADE,
  PRIMARY KEY (appointment_id, service_id)
);

CREATE INDEX IF NOT EXISTS idx_appointment_services_service ON appointment_services (service_id);

INSERT INTO service_bundles (parent_service_id, bundled_service_id)
SELECT parent.id, child.id
FROM services parent
JOIN services child
  ON child.name IN ('ShapeScale', 'Epigenetic study')
 AND child.is_active
WHERE parent.name = 'Founders Price 90 Days Thrive Formative Method'
ON CONFLICT DO NOTHING;

UPDATE services
SET duration_minutes = 180,
    buffer_after_minutes = 0,
    max_per_patient = 1,
    max_per_day = 1,
    slot_window_start = '09:00',
    slot_window_end = '12:00',
    description = 'First visit of the 90-day plan. One three-hour morning slot covering the initial consult, ShapeScale 1, and epigenetic study 1.'
WHERE name = 'Founders Price 90 Days Thrive Formative Method';

UPDATE services
SET duration_minutes = 240,
    slot_window_start = '13:00',
    slot_window_end = '17:00',
    description = 'Four-hour afternoon follow-up during the 90-day plan. Up to 6 visits per client, every 2 weeks.'
WHERE name = 'Follow-up visit';

-- Los 90 días no empiezan en la compra: el periodo queda pendiente hasta la primera cita larga.
UPDATE patient_memberships pm
SET current_period_start = NULL,
    current_period_end = NULL
FROM memberships m
WHERE m.id = pm.membership_id
  AND m.interval_unit = 'day90'
  AND pm.status = 'active'
  AND NOT EXISTS (
    SELECT 1
    FROM appointments a
    JOIN service_bundles b ON b.parent_service_id = a.service_id
    WHERE a.patient_id = pm.patient_id
      AND a.status NOT IN ('cancelled', 'no_show')
  );

UPDATE patient_membership_credits c
SET period_end = DATE '2099-12-31'
FROM patient_memberships pm
JOIN memberships m ON m.id = pm.membership_id
WHERE c.patient_membership_id = pm.id
  AND m.interval_unit = 'day90'
  AND pm.status = 'active'
  AND pm.current_period_start IS NULL;
