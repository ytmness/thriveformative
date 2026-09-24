-- Thrive Formative — Postgres local (sin Supabase Auth / RLS)
-- Formato alineado a Somnus: DATABASE_URL=postgresql://thrive_app:***@127.0.0.1:5432/thriveformative

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ─── CMS ───────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cms_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  locale text NOT NULL CHECK (locale IN ('es', 'en', 'ko', 'it')),
  sort_order int NOT NULL DEFAULT 0,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_cms_services_locale_sort ON cms_services (locale, sort_order);

CREATE TABLE IF NOT EXISTS cms_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  locale text NOT NULL CHECK (locale IN ('es', 'en', 'ko', 'it')),
  sort_order int NOT NULL DEFAULT 0,
  name text NOT NULL,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_featured boolean NOT NULL DEFAULT false,
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_cms_plans_locale_sort ON cms_plans (locale, sort_order);

CREATE TABLE IF NOT EXISTS cms_articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  locale text NOT NULL CHECK (locale IN ('es', 'en', 'ko', 'it')),
  sort_order int NOT NULL DEFAULT 0,
  category text NOT NULL DEFAULT '',
  title text NOT NULL,
  body text,
  image_url text,
  is_published boolean NOT NULL DEFAULT true,
  published_at date DEFAULT current_date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_cms_articles_locale_sort ON cms_articles (locale, sort_order);

CREATE TABLE IF NOT EXISTS cms_text_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  locale text NOT NULL CHECK (locale IN ('es', 'en', 'ko', 'it')),
  content_key text NOT NULL,
  value text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (locale, content_key)
);
CREATE INDEX IF NOT EXISTS idx_cms_text_entries_locale ON cms_text_entries (locale);

-- ─── Store ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS store_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  locale text NOT NULL CHECK (locale IN ('es', 'en', 'ko', 'it')),
  name text NOT NULL,
  slug text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (locale, slug)
);
CREATE INDEX IF NOT EXISTS idx_store_categories_locale_sort ON store_categories (locale, sort_order);

CREATE TABLE IF NOT EXISTS store_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  locale text NOT NULL CHECK (locale IN ('es', 'en', 'ko', 'it')),
  sort_order int NOT NULL DEFAULT 0,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  ref text NOT NULL,
  referral_url text NOT NULL,
  image_url text,
  is_published boolean NOT NULL DEFAULT true,
  category_id uuid REFERENCES store_categories (id) ON DELETE SET NULL,
  price_min numeric(10, 2),
  price_max numeric(10, 2),
  compare_at_price_min numeric(10, 2),
  currency text DEFAULT 'USD',
  source text,
  source_handle text,
  source_payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (locale, ref)
);
CREATE INDEX IF NOT EXISTS idx_store_products_locale_sort ON store_products (locale, sort_order);
CREATE INDEX IF NOT EXISTS idx_store_products_category_id ON store_products (category_id);
CREATE INDEX IF NOT EXISTS idx_store_products_source ON store_products (source);

-- ─── Contact + admin notifications ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS contact_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  subject text,
  message text NOT NULL,
  read_at timestamptz,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_contact_requests_created_at ON contact_requests (created_at DESC);

CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL,
  title text NOT NULL,
  body text,
  reference_id uuid,
  read_at timestamptz,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications (created_at DESC);

CREATE OR REPLACE FUNCTION notify_admins_contact_request()
RETURNS trigger AS $$
BEGIN
  INSERT INTO notifications (type, title, body, reference_id)
  VALUES (
    'contact_request',
    'Nueva solicitud: ' || coalesce(NEW.subject, '(sin asunto)'),
    NEW.name || ' — ' || NEW.email,
    NEW.id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_contact_request_created ON contact_requests;
CREATE TRIGGER on_contact_request_created
  AFTER INSERT ON contact_requests
  FOR EACH ROW EXECUTE PROCEDURE notify_admins_contact_request();
