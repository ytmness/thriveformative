DO $$
DECLARE cname text;
BEGIN
  SELECT conname INTO cname
  FROM pg_constraint
  WHERE conrelid = 'patients'::regclass
    AND contype = 'c'
    AND pg_get_constraintdef(oid) ILIKE '%sex%';
  IF cname IS NOT NULL THEN
    EXECUTE format('ALTER TABLE patients DROP CONSTRAINT %I', cname);
  END IF;
END $$;

ALTER TABLE patients
  ADD CONSTRAINT patients_sex_check
  CHECK (sex IS NULL OR sex IN ('masculino', 'femenino', 'otro', 'prefiere_no'));

ALTER TABLE patients
  ADD COLUMN IF NOT EXISTS sex_detail text,
  ADD COLUMN IF NOT EXISTS emergency_name_enc bytea,
  ADD COLUMN IF NOT EXISTS emergency_phone_enc bytea,
  ADD COLUMN IF NOT EXISTS emergency_relation text;

ALTER TABLE clinical_notes
  ADD COLUMN IF NOT EXISTS title text;

CREATE TABLE IF NOT EXISTS patient_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients (id) ON DELETE CASCADE,
  title text NOT NULL,
  session_date date,
  notes_enc bytea,
  recorded_by uuid REFERENCES staff_users (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_patient_sessions_patient ON patient_sessions (patient_id, session_date DESC, created_at DESC);
