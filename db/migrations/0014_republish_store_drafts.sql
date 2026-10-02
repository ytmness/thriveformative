-- Vuelve a publicar el catálogo que la migración anterior dejó en borrador.
UPDATE store_products
SET is_published = true, updated_at = now()
WHERE is_published = false;
