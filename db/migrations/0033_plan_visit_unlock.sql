ALTER TABLE services
  ADD COLUMN IF NOT EXISTS unlocks_after_service_id uuid REFERENCES services (id) ON DELETE SET NULL;

DELETE FROM services
WHERE name = 'Initial appointment'
  AND NOT EXISTS (SELECT 1 FROM appointments a WHERE a.service_id = services.id);

UPDATE services
SET is_active = false, is_online_bookable = false
WHERE name = 'Initial appointment';

UPDATE services AS child
SET unlocks_after_service_id = parent.id
FROM services AS parent
WHERE parent.name = 'Founders Price 90 Days Thrive Formative Method'
  AND child.name IN ('Follow-up visit', 'ShapeScale', 'Epigenetic study');
