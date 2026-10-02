-- El catálogo público de la tienda queda en estos cinco suplementos,
-- los mismos que ya se cobran en el punto de venta.

ALTER TABLE store_products DROP CONSTRAINT IF EXISTS store_products_locale_ref_key;

DO $$
DECLARE cname text;
BEGIN
  SELECT con.conname INTO cname
  FROM pg_constraint con
  JOIN pg_class rel ON rel.oid = con.conrelid
  WHERE rel.relname = 'store_products'
    AND con.contype = 'u'
    AND pg_get_constraintdef(con.oid) LIKE '%locale%'
    AND pg_get_constraintdef(con.oid) LIKE '%ref%'
    AND pg_get_constraintdef(con.oid) NOT LIKE '%country%';
  IF cname IS NOT NULL THEN
    EXECUTE format('ALTER TABLE store_products DROP CONSTRAINT %I', cname);
  END IF;
END $$;

ALTER TABLE store_products DROP CONSTRAINT IF EXISTS store_products_locale_country_ref_key;
ALTER TABLE store_products
  ADD CONSTRAINT store_products_locale_country_ref_key UNIQUE (locale, country, ref);

INSERT INTO store_categories (locale, country, name, slug, sort_order)
SELECT loc.locale,
       ctry.country,
       CASE loc.locale
         WHEN 'en' THEN 'Supplements'
         WHEN 'ko' THEN '보충제'
         WHEN 'it' THEN 'Integratori'
         ELSE 'Suplementos'
       END,
       'suplementos',
       0
FROM (VALUES ('es'), ('en'), ('ko'), ('it')) AS loc(locale)
CROSS JOIN (VALUES ('MX'), ('US')) AS ctry(country)
ON CONFLICT ON CONSTRAINT store_categories_locale_country_slug_key DO NOTHING;

UPDATE store_products
SET is_published = false, updated_at = now()
WHERE ref NOT IN ('magnesio', 'omega-3', 'probiotico', 'proteina', 'vitamina-d3');

INSERT INTO store_products (
  locale, country, sort_order, name, description, ref, referral_url,
  is_published, price_min, price_max, currency, source, category_id
)
SELECT item.locale,
       ctry.country,
       item.sort_order,
       item.name,
       item.description,
       item.ref,
       'https://thriveformative.com',
       true,
       item.price,
       item.price,
       'USD',
       'catalog',
       category.id
FROM (VALUES
  ('es', 1, 'Magnesio', 'Glicinato de magnesio.', 'magnesio', 22),
  ('es', 2, 'Omega-3', 'Aceite de pescado concentrado.', 'omega-3', 32),
  ('es', 3, 'Probiótico', 'Mezcla de cepas para microbiota.', 'probiotico', 28),
  ('es', 4, 'Proteína', 'Proteína de suero sin sabor.', 'proteina', 48),
  ('es', 5, 'Vitamina D3', 'Colecalciferol 5000 UI.', 'vitamina-d3', 18),
  ('en', 1, 'Magnesium', 'Magnesium glycinate.', 'magnesio', 22),
  ('en', 2, 'Omega-3', 'Concentrated fish oil.', 'omega-3', 32),
  ('en', 3, 'Probiotic', 'Strain blend for the microbiota.', 'probiotico', 28),
  ('en', 4, 'Protein', 'Unflavored whey protein.', 'proteina', 48),
  ('en', 5, 'Vitamin D3', 'Cholecalciferol 5000 IU.', 'vitamina-d3', 18),
  ('ko', 1, '마그네슘', '마그네슘 글리시네이트.', 'magnesio', 22),
  ('ko', 2, '오메가-3', '농축 피쉬 오일.', 'omega-3', 32),
  ('ko', 3, '프로바이오틱', '장내 미생물을 위한 균주 블렌드.', 'probiotico', 28),
  ('ko', 4, '프로틴', '무맛 유청 단백질.', 'proteina', 48),
  ('ko', 5, '비타민 D3', '콜레칼시페롤 5000 IU.', 'vitamina-d3', 18),
  ('it', 1, 'Magnesio', 'Glicinato di magnesio.', 'magnesio', 22),
  ('it', 2, 'Omega-3', 'Olio di pesce concentrato.', 'omega-3', 32),
  ('it', 3, 'Probiotico', 'Miscela di ceppi per il microbiota.', 'probiotico', 28),
  ('it', 4, 'Proteina', 'Proteine del siero senza sapore.', 'proteina', 48),
  ('it', 5, 'Vitamina D3', 'Colecalciferolo 5000 UI.', 'vitamina-d3', 18)
) AS item(locale, sort_order, name, description, ref, price)
CROSS JOIN (VALUES ('MX'), ('US')) AS ctry(country)
JOIN store_categories category
  ON category.locale = item.locale
 AND category.country = ctry.country
 AND category.slug = 'suplementos'
ON CONFLICT ON CONSTRAINT store_products_locale_country_ref_key
DO UPDATE SET
  sort_order = EXCLUDED.sort_order,
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price_min = EXCLUDED.price_min,
  price_max = EXCLUDED.price_max,
  currency = EXCLUDED.currency,
  is_published = true,
  source = EXCLUDED.source,
  category_id = EXCLUDED.category_id,
  updated_at = now();

INSERT INTO product_categories (name, sort_order)
SELECT 'Suplementos', 1
WHERE NOT EXISTS (SELECT 1 FROM product_categories WHERE name = 'Suplementos');

UPDATE products AS product
SET description = item.description,
    price = item.price,
    category_id = category.id,
    is_active = true,
    updated_at = now()
FROM (VALUES
  ('Magnesio', 'Glicinato de magnesio.', 22),
  ('Omega-3', 'Aceite de pescado concentrado.', 32),
  ('Probiótico', 'Mezcla de cepas para microbiota.', 28),
  ('Proteína', 'Proteína de suero sin sabor.', 48),
  ('Vitamina D3', 'Colecalciferol 5000 UI.', 18)
) AS item(name, description, price)
JOIN product_categories category ON category.name = 'Suplementos'
WHERE product.name = item.name;

INSERT INTO products (category_id, name, sku, description, price, is_active)
SELECT category.id, item.name, item.sku, item.description, item.price, true
FROM product_categories category
JOIN (VALUES
  ('Magnesio', 'DEMO-MG', 'Glicinato de magnesio.', 22),
  ('Omega-3', 'DEMO-OM3', 'Aceite de pescado concentrado.', 32),
  ('Probiótico', 'DEMO-PB', 'Mezcla de cepas para microbiota.', 28),
  ('Proteína', 'DEMO-PRO', 'Proteína de suero sin sabor.', 48),
  ('Vitamina D3', 'DEMO-D3', 'Colecalciferol 5000 UI.', 18)
) AS item(name, sku, description, price) ON true
WHERE category.name = 'Suplementos'
  AND NOT EXISTS (SELECT 1 FROM products existing WHERE existing.name = item.name);
