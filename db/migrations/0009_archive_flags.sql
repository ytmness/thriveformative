ALTER TABLE leads ADD COLUMN IF NOT EXISTS archived_at timestamptz;
CREATE INDEX IF NOT EXISTS idx_leads_archived ON leads (archived_at) WHERE archived_at IS NULL;
