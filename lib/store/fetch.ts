import { createClient } from "@/lib/supabase";
import { PRODUCT_FIELDS, type ProductRow } from "@/lib/store/fields";
import type { Locale, StoreCategory, StoreProduct } from "@/lib/store/types";

export const STORE_REVALIDATE_SECONDS = 60;

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

export async function fetchStoreCategories(locale: Locale): Promise<StoreCategory[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("store_categories")
    .select("id, locale, name, slug, sort_order")
    .eq("locale", locale)
    .order("sort_order", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as StoreCategory[];
}

export async function fetchStoreProducts(
  locale: Locale,
  options?: { includeUnpublished?: boolean; categorySlug?: string | null }
): Promise<StoreProduct[]> {
  const supabase = createClient();
  const includeUnpublished = options?.includeUnpublished ?? false;
  const categorySlug = options?.categorySlug;

  const categories = await fetchStoreCategories(locale);

  let query = supabase
    .from("store_products")
    .select(PRODUCT_FIELDS)
    .eq("locale", locale)
    .order("sort_order", { ascending: true });

  if (!includeUnpublished) {
    query = query.eq("is_published", true);
  }

  if (categorySlug) {
    const cat = categories.find((c) => c.slug === categorySlug);
    if (!cat) return [];
    query = query.eq("category_id", cat.id);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  return joinProductsWithCategories((data ?? []) as ProductRow[], categories);
}

export async function fetchStoreProductByRef(
  locale: Locale,
  ref: string,
  options?: { includeUnpublished?: boolean }
): Promise<StoreProduct | null> {
  const supabase = createClient();
  const includeUnpublished = options?.includeUnpublished ?? false;

  let query = supabase
    .from("store_products")
    .select(PRODUCT_FIELDS)
    .eq("locale", locale)
    .eq("ref", ref);

  if (!includeUnpublished) {
    query = query.eq("is_published", true);
  }

  const [categories, productResult] = await Promise.all([
    fetchStoreCategories(locale),
    query.maybeSingle(),
  ]);

  const { data, error } = productResult;
  if (error) throw new Error(error.message);
  if (!data) return null;

  return joinProductsWithCategories([data as ProductRow], categories)[0] ?? null;
}

export function attachCategoryToProduct(
  product: ProductRow,
  categories: StoreCategory[]
): StoreProduct {
  return joinProductsWithCategories([product], categories)[0];
}
