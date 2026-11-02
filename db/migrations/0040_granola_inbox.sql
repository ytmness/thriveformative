CREATE TABLE IF NOT EXISTS granola_notes_inbox (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  granola_note_id text NOT NULL UNIQUE,
  title text,
  note_date timestamptz,
  body_enc bytea,
  assigned_patient_id uuid REFERENCES patients (id) ON DELETE SET NULL,
  assigned_folder_key text,
  assigned_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_granola_inbox_unassigned
  ON granola_notes_inbox (created_at DESC)
  WHERE assigned_patient_id IS NULL;
