import { query } from "@/lib/db";
import { normalizeCountry } from "@/lib/domain/scope";
import { CLINIC_SERVICE_CATEGORY_SLUGS } from "@/lib/store/clinicServices";
import { PRODUCT_FIELDS_SQL, type ProductRow } from "@/lib/store/fields";
import { productImageList } from "@/lib/store/images";
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
    const image_urls = productImageList(rest);
    return {
      ...rest,
      description: rest.description ?? "",
      image_url: image_urls[0] ?? rest.image_url ?? null,
      image_urls,
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

export async function fetchStoreCategoriesFromDb(
  locale: Locale,
  country?: string | null,
  options?: { includeServiceCategories?: boolean }
): Promise<StoreCategory[]> {
  const params: unknown[] = [locale, countryOf(country)];
  let sql = `SELECT id, locale, country, name, slug, sort_order
     FROM store_categories WHERE locale = $1 AND country = $2`;
  if (!options?.includeServiceCategories) {
    params.push(CLINIC_SERVICE_CATEGORY_SLUGS);
    sql += ` AND slug <> ALL($${params.length}::text[])`;
  }
  sql += ` ORDER BY sort_order ASC`;
  const res = await query<StoreCategory>(sql, params);
  return res.rows;
}

export async function fetchStoreProductsFromDb(
  locale: Locale,
  options?: { includeUnpublished?: boolean; categorySlug?: string | null; country?: string | null }
): Promise<StoreProduct[]> {
  const includeUnpublished = options?.includeUnpublished ?? false;
  const country = countryOf(options?.country);
  const categories = await fetchStoreCategoriesFromDb(locale, country, { includeServiceCategories: true });

  const params: unknown[] = [locale, country];
  let sql = `SELECT ${PRODUCT_FIELDS_SQL}, source_payload FROM store_products WHERE locale = $1 AND country = $2`;
  if (!includeUnpublished) {
    sql += ` AND is_published = true`;
    params.push(CLINIC_SERVICE_CATEGORY_SLUGS);
    sql += ` AND NOT EXISTS (
      SELECT 1 FROM store_categories sc
      WHERE sc.id = store_products.category_id AND sc.slug = ANY($${params.length}::text[])
    )`;
  }
  if (options?.categorySlug) {
    const cat = categories.find((c) => c.slug === options.categorySlug);
    if (!cat || (!includeUnpublished && CLINIC_SERVICE_CATEGORY_SLUGS.includes(cat.slug))) return [];
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
    params.push(CLINIC_SERVICE_CATEGORY_SLUGS);
    sql += ` AND NOT EXISTS (
      SELECT 1 FROM store_categories sc
      WHERE sc.id = store_products.category_id AND sc.slug = ANY($${params.length}::text[])
    )`;
  }
  sql += ` LIMIT 1`;
  const res = await query<ProductRow>(sql, params);
  if (!res.rows[0]) return null;
  const categories = await fetchStoreCategoriesFromDb(locale, res.rows[0].country, {
    includeServiceCategories: true,
  });
  return joinProductsWithCategories([res.rows[0]], categories)[0] ?? null;
}
