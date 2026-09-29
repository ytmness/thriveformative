CREATE SEQUENCE sale_number_seq;
CREATE SEQUENCE invoice_number_seq;
CREATE SEQUENCE quote_number_seq;
CREATE SEQUENCE credit_note_number_seq;

CREATE TABLE suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text,
  phone text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE product_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  sort_order int NOT NULL DEFAULT 0
);

CREATE TABLE products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES product_categories (id) ON DELETE SET NULL,
  supplier_id uuid REFERENCES suppliers (id) ON DELETE SET NULL,
  name text NOT NULL,
  barcode text,
  sku text,
  size_label text,
  description text NOT NULL DEFAULT '',
  image_url text,
  cost numeric(12, 2) NOT NULL DEFAULT 0,
  price numeric(12, 2) NOT NULL DEFAULT 0,
  tax_id uuid REFERENCES taxes (id) ON DELETE SET NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_products_sku ON products (sku);
CREATE INDEX idx_products_barcode ON products (barcode);

CREATE TABLE product_stock (
  product_id uuid NOT NULL REFERENCES products (id) ON DELETE CASCADE,
  location_id uuid NOT NULL REFERENCES locations (id) ON DELETE CASCADE,
  quantity numeric(12, 2) NOT NULL DEFAULT 0,
  min_stock numeric(12, 2) NOT NULL DEFAULT 0,
  max_stock numeric(12, 2),
  PRIMARY KEY (product_id, location_id)
);

CREATE TABLE stock_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products (id) ON DELETE CASCADE,
  location_id uuid NOT NULL REFERENCES locations (id) ON DELETE CASCADE,
  movement_type text NOT NULL CHECK (movement_type IN ('adjust', 'sale', 'purchase', 'waste', 'transfer')),
  quantity numeric(12, 2) NOT NULL,
  reason text,
  staff_user_id uuid REFERENCES staff_users (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  price numeric(12, 2) NOT NULL DEFAULT 0,
  description text NOT NULL DEFAULT '',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE package_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id uuid NOT NULL REFERENCES packages (id) ON DELETE CASCADE,
  service_id uuid REFERENCES services (id) ON DELETE SET NULL,
  product_id uuid REFERENCES products (id) ON DELETE SET NULL,
  quantity int NOT NULL DEFAULT 1 CHECK (quantity > 0)
);

CREATE TABLE memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  price numeric(12, 2) NOT NULL DEFAULT 0,
  interval_unit text NOT NULL DEFAULT 'month' CHECK (interval_unit IN ('month', 'year')),
  description text NOT NULL DEFAULT '',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE gift_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  initial_amount numeric(12, 2) NOT NULL,
  balance numeric(12, 2) NOT NULL,
  issued_to_patient_id uuid REFERENCES patients (id) ON DELETE SET NULL,
  expires_at date,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'redeemed', 'void')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE account_credits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients (id) ON DELETE CASCADE,
  amount numeric(12, 2) NOT NULL,
  balance numeric(12, 2) NOT NULL,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE patient_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients (id) ON DELETE CASCADE,
  package_id uuid NOT NULL REFERENCES packages (id) ON DELETE RESTRICT,
  remaining_quantity int NOT NULL,
  expires_at date,
  sale_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE patient_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients (id) ON DELETE CASCADE,
  membership_id uuid NOT NULL REFERENCES memberships (id) ON DELETE RESTRICT,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cancelled')),
  current_period_end date,
  stripe_subscription_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_number text NOT NULL UNIQUE,
  patient_id uuid REFERENCES patients (id) ON DELETE SET NULL,
  walk_in_name text,
  location_id uuid REFERENCES locations (id) ON DELETE SET NULL,
  staff_user_id uuid REFERENCES staff_users (id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'partial', 'paid', 'void')),
  subtotal numeric(12, 2) NOT NULL DEFAULT 0,
  discount_total numeric(12, 2) NOT NULL DEFAULT 0,
  tax_total numeric(12, 2) NOT NULL DEFAULT 0,
  total numeric(12, 2) NOT NULL DEFAULT 0,
  paid_total numeric(12, 2) NOT NULL DEFAULT 0,
  balance numeric(12, 2) NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE patient_packages
  ADD CONSTRAINT patient_packages_sale_fk
  FOREIGN KEY (sale_id) REFERENCES sales (id) ON DELETE SET NULL;

CREATE TABLE sale_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id uuid NOT NULL REFERENCES sales (id) ON DELETE CASCADE,
  item_type text NOT NULL CHECK (item_type IN ('service', 'product', 'package', 'membership', 'gift_card', 'credit')),
  reference_id uuid,
  description text NOT NULL,
  quantity numeric(12, 2) NOT NULL DEFAULT 1,
  unit_price numeric(12, 2) NOT NULL DEFAULT 0,
  discount numeric(12, 2) NOT NULL DEFAULT 0,
  tax_amount numeric(12, 2) NOT NULL DEFAULT 0,
  line_total numeric(12, 2) NOT NULL DEFAULT 0,
  staff_user_id uuid REFERENCES staff_users (id) ON DELETE SET NULL
);

CREATE TABLE invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number text NOT NULL UNIQUE,
  sale_id uuid REFERENCES sales (id) ON DELETE SET NULL,
  patient_id uuid REFERENCES patients (id) ON DELETE SET NULL,
  location_id uuid REFERENCES locations (id) ON DELETE SET NULL,
  issued_at timestamptz NOT NULL DEFAULT now(),
  due_at timestamptz,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('draft', 'open', 'partial', 'paid', 'void')),
  subtotal numeric(12, 2) NOT NULL DEFAULT 0,
  discount_total numeric(12, 2) NOT NULL DEFAULT 0,
  tax_total numeric(12, 2) NOT NULL DEFAULT 0,
  total numeric(12, 2) NOT NULL DEFAULT 0,
  paid_total numeric(12, 2) NOT NULL DEFAULT 0,
  pdf_path text,
  billing_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id uuid REFERENCES sales (id) ON DELETE CASCADE,
  invoice_id uuid REFERENCES invoices (id) ON DELETE SET NULL,
  patient_id uuid REFERENCES patients (id) ON DELETE SET NULL,
  method_id uuid REFERENCES payment_methods (id) ON DELETE SET NULL,
  amount numeric(12, 2) NOT NULL CHECK (amount > 0),
  currency text NOT NULL DEFAULT 'USD',
  status text NOT NULL DEFAULT 'succeeded' CHECK (status IN ('pending', 'succeeded', 'failed', 'void')),
  stripe_payment_intent_id text,
  received_at timestamptz,
  voided_at timestamptz,
  void_reason text,
  created_by uuid REFERENCES staff_users (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_payments_sale ON payments (sale_id);
CREATE INDEX idx_payments_stripe ON payments (stripe_payment_intent_id);

CREATE TABLE credit_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  credit_number text NOT NULL UNIQUE,
  invoice_id uuid NOT NULL REFERENCES invoices (id) ON DELETE RESTRICT,
  amount numeric(12, 2) NOT NULL CHECK (amount > 0),
  reason text,
  created_by uuid REFERENCES staff_users (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_number text NOT NULL UNIQUE,
  patient_id uuid REFERENCES patients (id) ON DELETE SET NULL,
  location_id uuid REFERENCES locations (id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'accepted', 'declined', 'expired')),
  valid_until date,
  subtotal numeric(12, 2) NOT NULL DEFAULT 0,
  tax_total numeric(12, 2) NOT NULL DEFAULT 0,
  total numeric(12, 2) NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE quote_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id uuid NOT NULL REFERENCES quotes (id) ON DELETE CASCADE,
  description text NOT NULL,
  quantity numeric(12, 2) NOT NULL DEFAULT 1,
  unit_price numeric(12, 2) NOT NULL DEFAULT 0,
  tax_amount numeric(12, 2) NOT NULL DEFAULT 0,
  line_total numeric(12, 2) NOT NULL DEFAULT 0
);

CREATE TRIGGER products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
CREATE TRIGGER sales_updated_at BEFORE UPDATE ON sales
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
