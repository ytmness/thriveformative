import { withTx } from "@/lib/dbTx";
import { query } from "@/lib/db";
import { normalizeCountry } from "@/lib/domain/scope";
import { minorToMajor } from "@/lib/square/money";
import { posSku, sellableVariations } from "@/lib/store/variations";

type StoreRow = {
  locale: string;
  ref: string;
  name: string;
  description: string;
  image_url: string | null;
  currency: string | null;
  source: string | null;
  source_payload: unknown;
  price_min: unknown;
  category_name: string | null;
};

const LOCALE_RANK: Record<string, number> = { es: 0, en: 1, ko: 2, it: 3 };

export async function copyStoreProductsToPos(countryInput?: string | null): Promise<{
  country: string;
  products: number;
  rows: number;
}> {
  const country = normalizeCountry(countryInput) || "MX";
  const listed = await query<StoreRow>(
    `SELECT p.locale, p.ref, p.name, p.description, p.image_url, p.currency, p.source,
            p.source_payload, p.price_min, c.name AS category_name
     FROM store_products p
     LEFT JOIN store_categories c ON c.id = p.category_id
     WHERE p.is_published = true AND p.country = $1`,
    [country]
  );

  const chosen = new Map<string, StoreRow>();
  for (const row of listed.rows) {
    const current = chosen.get(row.ref);
    if (!current || (LOCALE_RANK[row.locale] ?? 9) < (LOCALE_RANK[current.locale] ?? 9)) {
      chosen.set(row.ref, row);
    }
  }

  let rows = 0;
  await withTx(async (q) => {
    for (const product of chosen.values()) {
      const variations = sellableVariations({
        source: product.source,
        sourcePayload: product.source_payload,
        priceMin: product.price_min,
        currency: product.currency,
      });
      let categoryId: string | null = null;
      const categoryName = product.category_name?.trim();
      if (categoryName) {
        const category = await q<{ id: string }>(
          `INSERT INTO product_categories (name) VALUES ($1)
           ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
           RETURNING id`,
          [categoryName]
        );
        categoryId = category.rows[0]?.id ?? null;
      }

      for (const variation of variations) {
        const several = variations.length > 1 && variation.name !== "Estándar";
        const name = several ? `${product.name} · ${variation.name}` : product.name;
        const price = minorToMajor(variation.amount, variation.currency);
        const sizeLabel = several ? variation.name : null;
        const existing = await q<{ id: string }>(
          `SELECT id FROM products WHERE lower(name) = lower($1) ORDER BY created_at LIMIT 1`,
          [name]
        );
        let productId = existing.rows[0]?.id ?? null;
        if (productId) {
          await q(
            `UPDATE products SET category_id = $2, description = $3, image_url = COALESCE($4, image_url),
               price = $5, size_label = $6, is_active = true, updated_at = now()
             WHERE id = $1`,
            [productId, categoryId, product.description || "", product.image_url, price, sizeLabel]
          );
        } else {
          const inserted = await q<{ id: string }>(
            `INSERT INTO products (category_id, name, sku, size_label, description, image_url, price, is_active)
             VALUES ($1,$2,$3,$4,$5,$6,$7,true)
             ON CONFLICT (sku) WHERE sku IS NOT NULL AND sku <> ''
             DO UPDATE SET
               category_id = EXCLUDED.category_id,
               name = EXCLUDED.name,
               size_label = EXCLUDED.size_label,
               description = EXCLUDED.description,
               image_url = EXCLUDED.image_url,
               price = EXCLUDED.price,
               is_active = true,
               updated_at = now()
             RETURNING id`,
            [
              categoryId,
              name,
              posSku(country, product.ref, variation.id),
              sizeLabel,
              product.description || "",
              product.image_url,
              price,
            ]
          );
          productId = inserted.rows[0]?.id ?? null;
        }
        if (!productId) continue;
        await q(
          `INSERT INTO product_stock (product_id, location_id, quantity)
           SELECT $1, l.id, 0 FROM locations l
           ON CONFLICT (product_id, location_id) DO NOTHING`,
          [productId]
        );
        rows += 1;
      }
    }
  });

  return { country, products: chosen.size, rows };
}
