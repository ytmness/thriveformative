ALTER TABLE payments ADD COLUMN IF NOT EXISTS square_checkout_id text;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS square_payment_id text;
CREATE INDEX IF NOT EXISTS idx_payments_square_checkout ON payments (square_checkout_id);

UPDATE payment_methods SET name = 'Terminal Square' WHERE key = 'card';
