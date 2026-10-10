import { query } from "@/lib/db";
import { normalizeCountry } from "@/lib/domain/scope";
import { PRODUCT_FIELDS_SQL, type ProductRow } from "@/lib/store/fields";
import { sellableVariations } from "@/lib/store/variations";
import type { Locale, StoreCategory, StoreProduct } from "@/lib/store/types";

function countryOf(value: string | null | undefined) {
  return normalizeCountry(value) || "MX";
}

function joinProductsWithCategories(
  rows: ProductRow[],
  categories: StoreCategory[]
): StoreProduct[] {
  const byId = new Map(categories.map((c) => [c.id, c]));
  return rows.map((row) => {
    const { source_payload: sourcePayload, ...rest } = row;
    return {
      ...rest,
      description: rest.description ?? "",
      category_id: rest.category_id ?? null,
      category: rest.category_id ? (byId.get(rest.category_id) ?? null) : null,
      source: rest.source ?? null,
      source_handle: rest.source_handle ?? null,
      variations: sellableVariations({
        source: rest.source,
        sourcePayload,
        priceMin: rest.price_min,
        currency: rest.currency,
      }),
    };
  });
}

export async function fetchStoreCategoriesFromDb(locale: Locale, country?: string | null): Promise<StoreCategory[]> {
  const res = await query<StoreCategory>(
    `SELECT id, locale, country, name, slug, sort_order
     FROM store_categories WHERE locale = $1 AND country = $2
     ORDER BY sort_order ASC`,
    [locale, countryOf(country)]
  );
  return res.rows;
}

export async function fetchStoreProductsFromDb(
  locale: Locale,
  options?: { includeUnpublished?: boolean; categorySlug?: string | null; country?: string | null }
): Promise<StoreProduct[]> {
  const includeUnpublished = options?.includeUnpublished ?? false;
  const country = countryOf(options?.country);
  const categories = await fetchStoreCategoriesFromDb(locale, country);

  const params: unknown[] = [locale, country];
  let sql = `SELECT ${PRODUCT_FIELDS_SQL}, source_payload FROM store_products WHERE locale = $1 AND country = $2`;
  if (!includeUnpublished) {
    sql += ` AND is_published = true`;
  }
  if (options?.categorySlug) {
    const cat = categories.find((c) => c.slug === options.categorySlug);
    if (!cat) return [];
    params.push(cat.id);
    sql += ` AND category_id = $${params.length}`;
  }
  sql += ` ORDER BY sort_order ASC`;

  const res = await query<ProductRow>(sql, params);
  return joinProductsWithCategories(res.rows, categories);
}

export async function fetchStoreProductByRefFromDb(
  locale: Locale,
  ref: string,
  options?: { includeUnpublished?: boolean; country?: string | null }
): Promise<StoreProduct | null> {
  const includeUnpublished = options?.includeUnpublished ?? false;
  const params: unknown[] = [locale, ref];
  let sql = `SELECT ${PRODUCT_FIELDS_SQL}, source_payload FROM store_products WHERE locale = $1 AND ref = $2`;
  if (options?.country) {
    params.push(countryOf(options.country));
    sql += ` AND country = $${params.length}`;
  }
  if (!includeUnpublished) {
    sql += ` AND is_published = true`;
  }
  sql += ` LIMIT 1`;
  const res = await query<ProductRow>(sql, params);
  if (!res.rows[0]) return null;
  const categories = await fetchStoreCategoriesFromDb(locale, res.rows[0].country);
  return joinProductsWithCategories([res.rows[0]], categories)[0] ?? null;
}
