CREATE TABLE form_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  form_type text NOT NULL CHECK (form_type IN ('intake', 'consent', 'soap', 'custom')),
  schema jsonb NOT NULL DEFAULT '[]'::jsonb,
  requires_signature boolean NOT NULL DEFAULT false,
  version int NOT NULL DEFAULT 1,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE services
  ADD CONSTRAINT services_required_form_fk
  FOREIGN KEY (required_form_template_id) REFERENCES form_templates (id) ON DELETE SET NULL;

CREATE TABLE form_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES form_templates (id) ON DELETE RESTRICT,
  patient_id uuid NOT NULL REFERENCES patients (id) ON DELETE CASCADE,
  appointment_id uuid REFERENCES appointments (id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'completed', 'expired')),
  access_token_hash text UNIQUE,
  sent_at timestamptz,
  due_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE form_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid NOT NULL REFERENCES form_assignments (id) ON DELETE CASCADE,
  answers_enc bytea NOT NULL,
  signature_path text,
  signed_at timestamptz,
  signer_name text,
  ip text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE message_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel text NOT NULL CHECK (channel IN ('sms', 'email')),
  template_key text NOT NULL,
  locale text NOT NULL DEFAULT 'es',
  subject text,
  body text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  UNIQUE (channel, template_key, locale)
);

CREATE TABLE message_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trigger_key text NOT NULL,
  offset_minutes int NOT NULL DEFAULT 0,
  channel text NOT NULL CHECK (channel IN ('sms', 'email')),
  template_id uuid REFERENCES message_templates (id) ON DELETE SET NULL,
  is_active boolean NOT NULL DEFAULT true
);

CREATE TABLE messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel text NOT NULL CHECK (channel IN ('sms', 'email')),
  recipient_enc bytea,
  patient_id uuid REFERENCES patients (id) ON DELETE SET NULL,
  appointment_id uuid REFERENCES appointments (id) ON DELETE SET NULL,
  template_id uuid REFERENCES message_templates (id) ON DELETE SET NULL,
  rule_id uuid REFERENCES message_rules (id) ON DELETE SET NULL,
  subject text,
  body text NOT NULL,
  provider text,
  provider_id text,
  status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'sent', 'failed', 'skipped')),
  error text,
  scheduled_for timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_messages_queue ON messages (status, scheduled_for);
CREATE UNIQUE INDEX idx_messages_appt_rule
  ON messages (appointment_id, rule_id)
  WHERE appointment_id IS NOT NULL AND rule_id IS NOT NULL;

CREATE TRIGGER form_templates_updated_at BEFORE UPDATE ON form_templates
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

CREATE TABLE patient_portal_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL UNIQUE REFERENCES patients (id) ON DELETE CASCADE,
  email_hash bytea NOT NULL UNIQUE,
  email_enc bytea NOT NULL,
  password_hash text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_login_at timestamptz
);

CREATE TABLE patient_portal_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES patient_portal_accounts (id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz,
  ip text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  key_hash text NOT NULL UNIQUE,
  key_prefix text NOT NULL,
  scopes text[] NOT NULL DEFAULT '{}',
  last_used_at timestamptz,
  revoked_at timestamptz,
  created_by uuid REFERENCES staff_users (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE webhook_endpoints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  url text NOT NULL,
  secret text NOT NULL,
  events text[] NOT NULL DEFAULT '{}',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE webhook_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint_id uuid NOT NULL REFERENCES webhook_endpoints (id) ON DELETE CASCADE,
  event text NOT NULL,
  payload jsonb NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'delivered', 'failed')),
  attempts int NOT NULL DEFAULT 0,
  response_status int,
  next_retry_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_webhook_deliveries_retry ON webhook_deliveries (status, next_retry_at);
