CREATE TABLE store_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  public_token uuid NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  locale text NOT NULL CHECK (locale IN ('es', 'en', 'ko', 'it')),
  status text NOT NULL DEFAULT 'paid' CHECK (status IN ('paid', 'ready', 'completed', 'cancelled')),
  fulfillment text NOT NULL CHECK (fulfillment IN ('pickup', 'shipping')),
  location_id uuid REFERENCES locations (id) ON DELETE SET NULL,
  recipient_name text NOT NULL,
  address_line1 text,
  city text,
  state text,
  postal_code text,
  country text,
  currency text NOT NULL,
  total_amount int NOT NULL CHECK (total_amount > 0),
  square_order_id text,
  square_payment_id text,
  receipt_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX store_orders_created_at_idx ON store_orders (created_at DESC);

CREATE TABLE store_order_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES store_orders (id) ON DELETE CASCADE,
  ref text NOT NULL,
  name text NOT NULL,
  variation_name text,
  quantity int NOT NULL CHECK (quantity > 0),
  unit_amount int NOT NULL CHECK (unit_amount >= 0),
  currency text NOT NULL,
  image_url text
);

CREATE INDEX store_order_lines_order_id_idx ON store_order_lines (order_id);
