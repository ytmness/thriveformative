CREATE TABLE locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  timezone text NOT NULL DEFAULT 'America/Chicago',
  street text,
  city text,
  state text,
  country text,
  postal_code text,
  phone text,
  email text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE staff_users
  ADD CONSTRAINT staff_users_default_location_fk
  FOREIGN KEY (default_location_id) REFERENCES locations (id) ON DELETE SET NULL;

CREATE TABLE rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id uuid NOT NULL REFERENCES locations (id) ON DELETE CASCADE,
  name text NOT NULL,
  color text NOT NULL DEFAULT '#d4a473',
  capacity int NOT NULL DEFAULT 1,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE service_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE taxes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  rate numeric(7, 4) NOT NULL,
  is_default boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES service_categories (id) ON DELETE SET NULL,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  duration_minutes int NOT NULL DEFAULT 30 CHECK (duration_minutes > 0),
  buffer_before_minutes int NOT NULL DEFAULT 0 CHECK (buffer_before_minutes >= 0),
  buffer_after_minutes int NOT NULL DEFAULT 0 CHECK (buffer_after_minutes >= 0),
  price numeric(12, 2) NOT NULL DEFAULT 0,
  tax_id uuid REFERENCES taxes (id) ON DELETE SET NULL,
  color text NOT NULL DEFAULT '#d4a473',
  is_online_bookable boolean NOT NULL DEFAULT true,
  deposit_amount numeric(12, 2),
  required_form_template_id uuid,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE service_locations (
  service_id uuid NOT NULL REFERENCES services (id) ON DELETE CASCADE,
  location_id uuid NOT NULL REFERENCES locations (id) ON DELETE CASCADE,
  PRIMARY KEY (service_id, location_id)
);

CREATE TABLE service_staff (
  service_id uuid NOT NULL REFERENCES services (id) ON DELETE CASCADE,
  staff_user_id uuid NOT NULL REFERENCES staff_users (id) ON DELETE CASCADE,
  PRIMARY KEY (service_id, staff_user_id)
);

CREATE TABLE service_rooms (
  service_id uuid NOT NULL REFERENCES services (id) ON DELETE CASCADE,
  room_id uuid NOT NULL REFERENCES rooms (id) ON DELETE CASCADE,
  PRIMARY KEY (service_id, room_id)
);

CREATE TABLE staff_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_user_id uuid NOT NULL REFERENCES staff_users (id) ON DELETE CASCADE,
  location_id uuid NOT NULL REFERENCES locations (id) ON DELETE CASCADE,
  day_of_week int NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time time NOT NULL,
  end_time time NOT NULL,
  valid_from date,
  valid_to date,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (end_time > start_time)
);
CREATE INDEX idx_staff_schedules_staff_dow ON staff_schedules (staff_user_id, day_of_week);

CREATE TABLE bookouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_user_id uuid REFERENCES staff_users (id) ON DELETE CASCADE,
  room_id uuid REFERENCES rooms (id) ON DELETE CASCADE,
  location_id uuid REFERENCES locations (id) ON DELETE CASCADE,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  all_day boolean NOT NULL DEFAULT false,
  kind text NOT NULL DEFAULT 'block',
  reason text,
  created_by uuid REFERENCES staff_users (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (ends_at > starts_at)
);
CREATE INDEX idx_bookouts_range ON bookouts (starts_at, ends_at);

CREATE TABLE payment_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  name text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0
);

CREATE TABLE clinic_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE custom_field_defs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity text NOT NULL CHECK (entity IN ('patient', 'lead', 'appointment', 'product')),
  field_key text NOT NULL,
  label text NOT NULL,
  field_type text NOT NULL CHECK (field_type IN ('text', 'number', 'date', 'select', 'checkbox', 'textarea')),
  options jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_required boolean NOT NULL DEFAULT false,
  sort_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  UNIQUE (entity, field_key)
);

CREATE TABLE custom_field_values (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  field_id uuid NOT NULL REFERENCES custom_field_defs (id) ON DELETE CASCADE,
  entity_id uuid NOT NULL,
  value jsonb,
  UNIQUE (field_id, entity_id)
);

CREATE TABLE booking_settings (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  slot_interval_minutes int NOT NULL DEFAULT 15,
  min_advance_hours int NOT NULL DEFAULT 2,
  max_advance_days int NOT NULL DEFAULT 90,
  cancel_window_hours int NOT NULL DEFAULT 24,
  allow_reschedule boolean NOT NULL DEFAULT true,
  allow_waitlist boolean NOT NULL DEFAULT true,
  require_terms boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER locations_updated_at BEFORE UPDATE ON locations
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
CREATE TRIGGER rooms_updated_at BEFORE UPDATE ON rooms
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
CREATE TRIGGER services_updated_at BEFORE UPDATE ON services
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
