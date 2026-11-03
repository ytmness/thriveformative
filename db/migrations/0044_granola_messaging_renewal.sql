ALTER TABLE clinical_notes
  ADD COLUMN IF NOT EXISTS granola_note_id text;

ALTER TABLE patient_sessions
  ADD COLUMN IF NOT EXISTS granola_note_id text;

CREATE UNIQUE INDEX IF NOT EXISTS idx_clinical_notes_granola_note
  ON clinical_notes (patient_id, granola_note_id)
  WHERE granola_note_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_patient_sessions_granola_note
  ON patient_sessions (patient_id, granola_note_id)
  WHERE granola_note_id IS NOT NULL;

ALTER TABLE granola_notes_inbox
  ADD COLUMN IF NOT EXISTS summary_enc bytea,
  ADD COLUMN IF NOT EXISTS private_notes_enc bytea,
  ADD COLUMN IF NOT EXISTS transcript_enc bytea,
  ADD COLUMN IF NOT EXISTS unassigned_reason text,
  ADD COLUMN IF NOT EXISTS matched_identifier text,
  ADD COLUMN IF NOT EXISTS matched_session int;

ALTER TABLE patient_memberships
  ADD COLUMN IF NOT EXISTS square_card_id text,
  ADD COLUMN IF NOT EXISTS auto_renew_last_attempt_on date,
  ADD COLUMN IF NOT EXISTS auto_renew_failures int NOT NULL DEFAULT 0;

INSERT INTO clinic_settings (key, value)
VALUES ('messaging_settings', '{"quietStart":21,"quietEnd":8,"smsProvider":"telnyx"}'::jsonb)
ON CONFLICT (key) DO NOTHING;
