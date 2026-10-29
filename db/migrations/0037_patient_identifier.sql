-- Add patient_identifier column for the clinic's internal ID format
ALTER TABLE patients ADD COLUMN IF NOT EXISTS patient_identifier text;

-- Add unique constraint (will be enforced after backfill for existing patients)
-- For now we allow NULL until backfill is complete
CREATE UNIQUE INDEX IF NOT EXISTS idx_patients_identifier ON patients (patient_identifier) WHERE patient_identifier IS NOT NULL;

-- Add to search index for fast lookup
CREATE INDEX IF NOT EXISTS idx_patients_identifier_trgm ON patients USING gin (patient_identifier gin_trgm_ops) WHERE patient_identifier IS NOT NULL;
