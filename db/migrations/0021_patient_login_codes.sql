CREATE TABLE patient_login_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email_hash bytea NOT NULL,
  code_hash text NOT NULL,
  purpose text NOT NULL CHECK (purpose IN ('login', 'register')),
  expires_at timestamptz NOT NULL,
  attempts int NOT NULL DEFAULT 0,
  consumed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_patient_login_codes_email ON patient_login_codes (email_hash, created_at DESC);
