ALTER TABLE patient_sessions
  ADD COLUMN IF NOT EXISTS duration_seconds integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS timer_started boolean NOT NULL DEFAULT false;
