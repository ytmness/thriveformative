-- País en la tienda pública y servicios distintos por país.

ALTER TABLE store_categories ADD COLUMN IF NOT EXISTS country text NOT NULL DEFAULT 'MX';
ALTER TABLE store_products ADD COLUMN IF NOT EXISTS country text NOT NULL DEFAULT 'MX';

UPDATE store_categories SET country = 'MX' WHERE country NOT IN ('MX', 'US');
UPDATE store_products SET country = 'MX' WHERE country NOT IN ('MX', 'US');

ALTER TABLE store_categories DROP CONSTRAINT IF EXISTS store_categories_country_chk;
ALTER TABLE store_categories ADD CONSTRAINT store_categories_country_chk CHECK (country IN ('MX', 'US'));
ALTER TABLE store_products DROP CONSTRAINT IF EXISTS store_products_country_chk;
ALTER TABLE store_products ADD CONSTRAINT store_products_country_chk CHECK (country IN ('MX', 'US'));

DO $$
DECLARE cname text;
BEGIN
  SELECT con.conname INTO cname
  FROM pg_constraint con
  JOIN pg_class rel ON rel.oid = con.conrelid
  WHERE rel.relname = 'store_categories'
    AND con.contype = 'u'
    AND pg_get_constraintdef(con.oid) NOT LIKE '%country%';
  IF cname IS NOT NULL THEN
    EXECUTE format('ALTER TABLE store_categories DROP CONSTRAINT %I', cname);
  END IF;
END $$;

ALTER TABLE store_categories DROP CONSTRAINT IF EXISTS store_categories_locale_country_slug_key;
ALTER TABLE store_categories
  ADD CONSTRAINT store_categories_locale_country_slug_key UNIQUE (locale, country, slug);

INSERT INTO store_categories (locale, name, slug, sort_order, country)
SELECT locale, name, slug, sort_order, 'US'
FROM store_categories
WHERE country = 'MX'
ON CONFLICT ON CONSTRAINT store_categories_locale_country_slug_key DO NOTHING;

INSERT INTO store_products (locale, sort_order, name, description, ref, referral_url, is_published, currency, country)
SELECT 'es', 0, 'Omega-3', 'Aceite de pescado concentrado para uso diario.', 'omega-3-us', 'https://thriveformative.com', true, 'USD', 'US'
WHERE NOT EXISTS (SELECT 1 FROM store_products WHERE locale = 'es' AND ref = 'omega-3-us');

INSERT INTO store_products (locale, sort_order, name, description, ref, referral_url, is_published, currency, country)
SELECT 'es', 1, 'Vitamina D3', 'Vitamina D diaria del catalogo de Estados Unidos.', 'vitamin-d3-us', 'https://thriveformative.com', true, 'USD', 'US'
WHERE NOT EXISTS (SELECT 1 FROM store_products WHERE locale = 'es' AND ref = 'vitamin-d3-us');

INSERT INTO store_products (locale, sort_order, name, description, ref, referral_url, is_published, currency, country)
SELECT 'en', 0, 'Omega-3', 'Concentrated fish oil for daily use.', 'omega-3-us', 'https://thriveformative.com', true, 'USD', 'US'
WHERE NOT EXISTS (SELECT 1 FROM store_products WHERE locale = 'en' AND ref = 'omega-3-us');

INSERT INTO store_products (locale, sort_order, name, description, ref, referral_url, is_published, currency, country)
SELECT 'en', 1, 'Vitamin D3', 'Daily vitamin D for the United States catalog.', 'vitamin-d3-us', 'https://thriveformative.com', true, 'USD', 'US'
WHERE NOT EXISTS (SELECT 1 FROM store_products WHERE locale = 'en' AND ref = 'vitamin-d3-us');

UPDATE store_products p
SET category_id = c.id
FROM store_categories c
WHERE p.country = 'US'
  AND p.category_id IS NULL
  AND c.country = 'US'
  AND c.locale = p.locale
  AND c.sort_order = (SELECT MIN(sort_order) FROM store_categories x WHERE x.country = 'US' AND x.locale = p.locale);

DELETE FROM service_locations sl
USING locations l, services s
WHERE sl.location_id = l.id
  AND sl.service_id = s.id
  AND s.name IN ('Consulta inicial', 'Seguimiento mensual')
  AND upper(l.country) IN ('US', 'USA', 'UNITED STATES', 'ESTADOS UNIDOS');

DELETE FROM service_locations sl
USING locations l, services s
WHERE sl.location_id = l.id
  AND sl.service_id = s.id
  AND (s.name LIKE 'Lectura%' OR s.name LIKE 'Plan de h%')
  AND upper(l.country) IN ('MX', 'MEXICO', U&'M\00c9XICO');
