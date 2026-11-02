-- Expediente: 8 carpetas, subcarpetas de estudios y campos estructurados.

ALTER TABLE clinical_notes
  ADD COLUMN IF NOT EXISTS folder_key text NOT NULL DEFAULT 'plan90';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'clinical_notes_folder_key_check'
  ) THEN
    ALTER TABLE clinical_notes
      ADD CONSTRAINT clinical_notes_folder_key_check
      CHECK (folder_key IN ('plan90', 'prioridades', 'desequilibrios'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_clinical_notes_folder
  ON clinical_notes (patient_id, folder_key, created_at DESC);

ALTER TABLE patient_allergies
  ADD COLUMN IF NOT EXISTS dose text,
  ADD COLUMN IF NOT EXISTS frequency text,
  ADD COLUMN IF NOT EXISTS since_date date,
  ADD COLUMN IF NOT EXISTS notes text;

ALTER TABLE patient_conditions
  ADD COLUMN IF NOT EXISTS dose text,
  ADD COLUMN IF NOT EXISTS frequency text,
  ADD COLUMN IF NOT EXISTS since_date date,
  ADD COLUMN IF NOT EXISTS notes text;

ALTER TABLE patient_medications
  ADD COLUMN IF NOT EXISTS dose text,
  ADD COLUMN IF NOT EXISTS frequency text,
  ADD COLUMN IF NOT EXISTS since_date date,
  ADD COLUMN IF NOT EXISTS notes text;

CREATE TABLE IF NOT EXISTS patient_supplements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients (id) ON DELETE CASCADE,
  value_enc bytea NOT NULL,
  dose text,
  frequency text,
  since_date date,
  notes text,
  recorded_by uuid REFERENCES staff_users (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_patient_supplements_patient
  ON patient_supplements (patient_id, created_at DESC);

CREATE TABLE IF NOT EXISTS patient_document_folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients (id) ON DELETE CASCADE,
  parent_key text NOT NULL,
  name text NOT NULL,
  slug text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (patient_id, parent_key, slug)
);
CREATE INDEX IF NOT EXISTS idx_patient_document_folders_patient
  ON patient_document_folders (patient_id, parent_key);

ALTER TABLE patient_documents
  ADD COLUMN IF NOT EXISTS folder_id uuid REFERENCES patient_document_folders (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS document_date date;

UPDATE patient_documents
SET document_date = coalesce(taken_at::date, created_at::date)
WHERE document_date IS NULL;

INSERT INTO patient_document_folders (patient_id, parent_key, name, slug)
SELECT DISTINCT d.patient_id, 'estudios', seed.name, seed.slug
FROM patient_documents d
CROSS JOIN (
  VALUES
    ('Imagenología', 'imaging'),
    ('Sangre / orina / saliva', 'labs'),
    ('Microbiota', 'microbiota'),
    ('Procedimientos', 'procedures'),
    ('Otros', 'otros')
) AS seed(name, slug)
ON CONFLICT (patient_id, parent_key, slug) DO NOTHING;

UPDATE patient_documents d
SET folder_id = f.id
FROM patient_document_folders f
WHERE d.folder_id IS NULL
  AND f.patient_id = d.patient_id
  AND f.parent_key = 'estudios'
  AND f.slug = CASE
    WHEN d.kind IN ('imaging', 'labs', 'microbiota', 'procedures') THEN d.kind
    ELSE 'otros'
  END;
