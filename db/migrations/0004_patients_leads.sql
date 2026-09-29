CREATE SEQUENCE patient_code_seq;

CREATE TABLE marketing_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  is_active boolean NOT NULL DEFAULT true
);

CREATE TABLE patients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_code text NOT NULL UNIQUE,
  location_id uuid REFERENCES locations (id) ON DELETE SET NULL,
  owner_staff_id uuid REFERENCES staff_users (id) ON DELETE SET NULL,
  salutation text,
  first_name text NOT NULL,
  last_name text NOT NULL,
  sex text CHECK (sex IS NULL OR sex IN ('masculino', 'femenino', 'otro')),
  birth_date date,
  preferred_language text NOT NULL DEFAULT 'es',
  marketing_source_id uuid REFERENCES marketing_sources (id) ON DELETE SET NULL,
  referred_by_name text,
  email_enc bytea,
  email_hash bytea,
  mobile_enc bytea,
  mobile_hash bytea,
  phone_enc bytea,
  phone_hash bytea,
  street text,
  city text,
  state text,
  country text,
  postal_code text,
  consent_sms boolean NOT NULL DEFAULT false,
  consent_email boolean NOT NULL DEFAULT false,
  consent_phone boolean NOT NULL DEFAULT false,
  consent_postal boolean NOT NULL DEFAULT false,
  privacy_policy_status text NOT NULL DEFAULT 'sin_respuesta'
    CHECK (privacy_policy_status IN ('sin_respuesta', 'aceptado', 'rechazado')),
  created_by uuid REFERENCES staff_users (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);
CREATE INDEX idx_patients_name ON patients (last_name, first_name);
CREATE INDEX idx_patients_name_trgm ON patients USING gin ((first_name || ' ' || last_name) gin_trgm_ops);
CREATE INDEX idx_patients_email_hash ON patients (email_hash);
CREATE INDEX idx_patients_mobile_hash ON patients (mobile_hash);

CREATE TABLE tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  color text NOT NULL DEFAULT '#d4a473'
);

CREATE TABLE patient_tags (
  patient_id uuid NOT NULL REFERENCES patients (id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES tags (id) ON DELETE CASCADE,
  PRIMARY KEY (patient_id, tag_id)
);

CREATE TABLE patient_allergies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients (id) ON DELETE CASCADE,
  value_enc bytea NOT NULL,
  severity text,
  recorded_by uuid REFERENCES staff_users (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE patient_conditions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients (id) ON DELETE CASCADE,
  value_enc bytea NOT NULL,
  recorded_by uuid REFERENCES staff_users (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE patient_medications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients (id) ON DELETE CASCADE,
  value_enc bytea NOT NULL,
  recorded_by uuid REFERENCES staff_users (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE patient_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients (id) ON DELETE CASCADE,
  kind text NOT NULL DEFAULT 'document',
  title text NOT NULL,
  storage_path text NOT NULL,
  mime_type text,
  size_bytes int,
  is_photo boolean NOT NULL DEFAULT false,
  taken_at timestamptz,
  uploaded_by uuid REFERENCES staff_users (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE clinical_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients (id) ON DELETE CASCADE,
  appointment_id uuid,
  author_id uuid REFERENCES staff_users (id) ON DELETE SET NULL,
  note_type text NOT NULL DEFAULT 'soap' CHECK (note_type IN ('soap', 'free', 'addendum')),
  parent_note_id uuid REFERENCES clinical_notes (id) ON DELETE SET NULL,
  subjective_enc bytea,
  objective_enc bytea,
  assessment_enc bytea,
  plan_enc bytea,
  body_enc bytea,
  locked_at timestamptz,
  signed_by uuid REFERENCES staff_users (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_clinical_notes_patient ON clinical_notes (patient_id, created_at DESC);

ALTER TABLE audit_log
  ADD CONSTRAINT audit_log_patient_fk
  FOREIGN KEY (patient_id) REFERENCES patients (id) ON DELETE SET NULL;

CREATE TRIGGER patients_updated_at BEFORE UPDATE ON patients
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

CREATE TABLE lead_stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  is_won boolean NOT NULL DEFAULT false,
  is_lost boolean NOT NULL DEFAULT false
);

CREATE TABLE leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id uuid REFERENCES locations (id) ON DELETE SET NULL,
  owner_staff_id uuid REFERENCES staff_users (id) ON DELETE SET NULL,
  stage_id uuid REFERENCES lead_stages (id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'won', 'lost')),
  salutation text,
  first_name text NOT NULL,
  last_name text NOT NULL,
  sex text CHECK (sex IS NULL OR sex IN ('masculino', 'femenino', 'otro')),
  birth_date date,
  preferred_language text NOT NULL DEFAULT 'es',
  marketing_source_id uuid REFERENCES marketing_sources (id) ON DELETE SET NULL,
  referred_by_name text,
  email_enc bytea,
  email_hash bytea,
  mobile_enc bytea,
  mobile_hash bytea,
  phone_enc bytea,
  street text,
  city text,
  state text,
  country text,
  postal_code text,
  estimated_value numeric(12, 2),
  won_at timestamptz,
  lost_at timestamptz,
  lost_reason text,
  converted_patient_id uuid REFERENCES patients (id) ON DELETE SET NULL,
  created_by uuid REFERENCES staff_users (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_leads_stage ON leads (stage_id, status);

CREATE TABLE lead_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES leads (id) ON DELETE CASCADE,
  staff_user_id uuid REFERENCES staff_users (id) ON DELETE SET NULL,
  activity_type text NOT NULL CHECK (activity_type IN ('call', 'email', 'sms', 'note', 'task')),
  body text NOT NULL DEFAULT '',
  due_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER leads_updated_at BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
