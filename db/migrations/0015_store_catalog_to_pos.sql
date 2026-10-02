-- Pasa el catálogo de la tienda al punto de venta y lo oculta del sitio público.
-- Magnesio, Omega-3, Probiótico, Proteína y Vitamina D3 ya están en caja y siguen en la tienda.

INSERT INTO product_categories (name, sort_order)
SELECT name, sort_order
FROM (VALUES ('Protocolos', 2), ('Kits y paquetes', 3)) AS category(name, sort_order)
WHERE NOT EXISTS (
  SELECT 1 FROM product_categories existing WHERE existing.name = category.name
);

INSERT INTO products (category_id, name, sku, description, image_url, price, is_active)
SELECT category.id,
       item.name,
       left('tienda:' || item.ref, 120),
       coalesce(item.description, ''),
       item.image_url,
       coalesce(item.price_min, 0),
       true
FROM store_products item
LEFT JOIN store_categories store_category ON store_category.id = item.category_id
LEFT JOIN product_categories category ON category.name = store_category.name
WHERE item.locale = 'es'
  AND item.country = 'MX'
  AND item.ref NOT IN ('magnesio', 'omega-3', 'probiotico', 'proteina', 'vitamina-d3')
  AND NOT EXISTS (
    SELECT 1 FROM products existing WHERE lower(existing.name) = lower(item.name)
  )
ON CONFLICT (sku) WHERE sku IS NOT NULL AND sku <> ''
DO UPDATE SET
  category_id = EXCLUDED.category_id,
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  image_url = EXCLUDED.image_url,
  price = EXCLUDED.price,
  is_active = true,
  updated_at = now();

INSERT INTO product_stock (product_id, location_id, quantity)
SELECT product.id, location.id, 0
FROM products product
JOIN locations location ON true
WHERE product.sku LIKE 'tienda:%'
ON CONFLICT (product_id, location_id) DO NOTHING;

UPDATE store_products
SET is_published = false, updated_at = now()
WHERE NOT (
  ref IN ('magnesio', 'omega-3', 'probiotico', 'proteina', 'vitamina-d3')
  AND source = 'catalog'
);
