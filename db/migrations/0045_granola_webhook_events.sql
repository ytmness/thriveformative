CREATE TABLE IF NOT EXISTS granola_webhook_events (
  event_id text PRIMARY KEY,
  granola_note_id text,
  event_type text,
  processed_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_granola_webhook_events_note
  ON granola_webhook_events (granola_note_id, processed_at DESC);
