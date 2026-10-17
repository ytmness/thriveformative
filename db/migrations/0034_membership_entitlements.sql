-- Membresías con cupos por servicio y renovación Square.

ALTER TABLE memberships
  DROP CONSTRAINT IF EXISTS memberships_interval_unit_check;

ALTER TABLE memberships
  ADD CONSTRAINT memberships_interval_unit_check
  CHECK (interval_unit IN ('month', 'year', 'day90'));

ALTER TABLE memberships
  ADD COLUMN IF NOT EXISTS square_plan_id text,
  ADD COLUMN IF NOT EXISTS square_plan_variation_id text;

CREATE TABLE IF NOT EXISTS membership_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  membership_id uuid NOT NULL REFERENCES memberships (id) ON DELETE CASCADE,
  service_id uuid NOT NULL REFERENCES services (id) ON DELETE CASCADE,
  quantity int NOT NULL DEFAULT 1 CHECK (quantity > 0),
  UNIQUE (membership_id, service_id)
);

ALTER TABLE patient_memberships
  ADD COLUMN IF NOT EXISTS square_subscription_id text,
  ADD COLUMN IF NOT EXISTS square_customer_id text,
  ADD COLUMN IF NOT EXISTS renewal_mode text NOT NULL DEFAULT 'manual'
    CHECK (renewal_mode IN ('square', 'manual')),
  ADD COLUMN IF NOT EXISTS current_period_start date,
  ADD COLUMN IF NOT EXISTS sale_id uuid REFERENCES sales (id) ON DELETE SET NULL;

UPDATE patient_memberships
SET square_subscription_id = coalesce(square_subscription_id, stripe_subscription_id)
WHERE square_subscription_id IS NULL AND stripe_subscription_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS patient_membership_credits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_membership_id uuid NOT NULL REFERENCES patient_memberships (id) ON DELETE CASCADE,
  service_id uuid NOT NULL REFERENCES services (id) ON DELETE CASCADE,
  allotted int NOT NULL CHECK (allotted >= 0),
  remaining int NOT NULL CHECK (remaining >= 0),
  period_start date NOT NULL,
  period_end date NOT NULL,
  UNIQUE (patient_membership_id, service_id, period_start)
);

CREATE INDEX IF NOT EXISTS idx_pmc_membership ON patient_membership_credits (patient_membership_id);
CREATE INDEX IF NOT EXISTS idx_pmc_service ON patient_membership_credits (service_id);

ALTER TABLE services
  ADD COLUMN IF NOT EXISTS requires_membership boolean NOT NULL DEFAULT false;

-- Plan 90 días: cupos por periodo.
INSERT INTO memberships (name, price, interval_unit, description, is_active)
SELECT
  '90 Days Thrive Formative Method',
  1850,
  'day90',
  'Plan of 90 days with included visits: Founders session, follow-ups, ShapeScale, and epigenetic study.',
  true
WHERE NOT EXISTS (
  SELECT 1 FROM memberships WHERE name = '90 Days Thrive Formative Method'
);

INSERT INTO membership_items (membership_id, service_id, quantity)
SELECT m.id, s.id, v.quantity
FROM memberships m
JOIN (
  VALUES
    ('Founders Price 90 Days Thrive Formative Method', 1),
    ('Follow-up visit', 6),
    ('ShapeScale', 3),
    ('Epigenetic study', 1)
) AS v(service_name, quantity) ON true
JOIN services s ON s.name = v.service_name AND s.is_active
WHERE m.name = '90 Days Thrive Formative Method'
ON CONFLICT (membership_id, service_id) DO UPDATE SET quantity = EXCLUDED.quantity;

UPDATE services
SET requires_membership = true,
    unlocks_after_service_id = NULL
WHERE name IN (
  'Founders Price 90 Days Thrive Formative Method',
  'Follow-up visit',
  'ShapeScale',
  'Epigenetic study'
);
