ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS patient_id uuid REFERENCES patients (id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_notifications_patient
  ON notifications (patient_id, created_at DESC);
