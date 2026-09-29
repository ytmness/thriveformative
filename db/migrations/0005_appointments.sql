CREATE TABLE appointment_recurrences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rrule text NOT NULL,
  until_date date,
  occurrence_count int,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid REFERENCES patients (id) ON DELETE SET NULL,
  service_id uuid REFERENCES services (id) ON DELETE SET NULL,
  staff_user_id uuid NOT NULL REFERENCES staff_users (id) ON DELETE RESTRICT,
  location_id uuid NOT NULL REFERENCES locations (id) ON DELETE RESTRICT,
  room_id uuid REFERENCES rooms (id) ON DELETE SET NULL,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  duration_minutes int NOT NULL CHECK (duration_minutes > 0),
  all_day boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'booked'
    CHECK (status IN ('booked', 'confirmed', 'arrived', 'completed', 'cancelled', 'no_show')),
  price numeric(12, 2),
  notes text,
  booked_online boolean NOT NULL DEFAULT false,
  recurrence_id uuid REFERENCES appointment_recurrences (id) ON DELETE SET NULL,
  manage_token_hash text,
  cancelled_at timestamptz,
  cancel_reason text,
  created_by uuid REFERENCES staff_users (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (ends_at > starts_at)
);
CREATE INDEX idx_appointments_range ON appointments (starts_at, ends_at);
CREATE INDEX idx_appointments_staff ON appointments (staff_user_id, starts_at);
CREATE INDEX idx_appointments_patient ON appointments (patient_id, starts_at);
CREATE INDEX idx_appointments_manage ON appointments (manage_token_hash);

ALTER TABLE appointments
  ADD CONSTRAINT appointments_no_staff_overlap
  EXCLUDE USING gist (
    staff_user_id WITH =,
    tstzrange(starts_at, ends_at, '[)') WITH &&
  ) WHERE (status NOT IN ('cancelled', 'no_show') AND all_day = false);

ALTER TABLE appointments
  ADD CONSTRAINT appointments_no_room_overlap
  EXCLUDE USING gist (
    room_id WITH =,
    tstzrange(starts_at, ends_at, '[)') WITH &&
  ) WHERE (
    status NOT IN ('cancelled', 'no_show')
    AND all_day = false
    AND room_id IS NOT NULL
  );

CREATE TABLE waitlist_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid REFERENCES patients (id) ON DELETE CASCADE,
  lead_id uuid REFERENCES leads (id) ON DELETE CASCADE,
  service_id uuid REFERENCES services (id) ON DELETE SET NULL,
  staff_user_id uuid REFERENCES staff_users (id) ON DELETE SET NULL,
  location_id uuid REFERENCES locations (id) ON DELETE SET NULL,
  desired_from timestamptz,
  desired_to timestamptz,
  status text NOT NULL DEFAULT 'waiting'
    CHECK (status IN ('waiting', 'offered', 'booked', 'cancelled')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (patient_id IS NOT NULL OR lead_id IS NOT NULL)
);

ALTER TABLE clinical_notes
  ADD CONSTRAINT clinical_notes_appointment_fk
  FOREIGN KEY (appointment_id) REFERENCES appointments (id) ON DELETE SET NULL;

CREATE TRIGGER appointments_updated_at BEFORE UPDATE ON appointments
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
