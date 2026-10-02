CREATE UNIQUE INDEX IF NOT EXISTS products_sku_not_blank
  ON products (sku)
  WHERE sku IS NOT NULL AND sku <> '';
