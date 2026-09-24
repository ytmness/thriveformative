import { query } from "@/lib/db";
import { PRODUCT_FIELDS_SQL, type ProductRow } from "@/lib/store/fields";
import type { Locale, StoreCategory, StoreProduct } from "@/lib/store/types";

function joinProductsWithCategories(
  rows: ProductRow[],
  categories: StoreCategory[]
): StoreProduct[] {
  const byId = new Map(categories.map((c) => [c.id, c]));
  return rows.map((row) => ({
    ...row,
    description: row.description ?? "",
    category_id: row.category_id ?? null,
    category: row.category_id ? (byId.get(row.category_id) ?? null) : null,
    source: row.source ?? null,
    source_handle: row.source_handle ?? null,
  }));
}

export async function fetchStoreCategoriesFromDb(locale: Locale): Promise<StoreCategory[]> {
  const res = await query<StoreCategory>(
    `SELECT id, locale, name, slug, sort_order
     FROM store_categories WHERE locale = $1
     ORDER BY sort_order ASC`,
    [locale]
  );
  return res.rows;
}

export async function fetchStoreProductsFromDb(
  locale: Locale,
  options?: { includeUnpublished?: boolean; categorySlug?: string | null }
): Promise<StoreProduct[]> {
  const includeUnpublished = options?.includeUnpublished ?? false;
  const categories = await fetchStoreCategoriesFromDb(locale);

  const params: unknown[] = [locale];
  let sql = `SELECT ${PRODUCT_FIELDS_SQL} FROM store_products WHERE locale = $1`;
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
  options?: { includeUnpublished?: boolean }
): Promise<StoreProduct | null> {
  const includeUnpublished = options?.includeUnpublished ?? false;
  const categories = await fetchStoreCategoriesFromDb(locale);
  const params: unknown[] = [locale, ref];
  let sql = `SELECT ${PRODUCT_FIELDS_SQL} FROM store_products WHERE locale = $1 AND ref = $2`;
  if (!includeUnpublished) {
    sql += ` AND is_published = true`;
  }
  sql += ` LIMIT 1`;
  const res = await query<ProductRow>(sql, params);
  if (!res.rows[0]) return null;
  return joinProductsWithCategories([res.rows[0]], categories)[0] ?? null;
}
