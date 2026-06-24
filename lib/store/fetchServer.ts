import { unstable_cache } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { PRODUCT_FIELDS, type ProductRow } from "@/lib/store/fields";
import { STORE_REVALIDATE_SECONDS } from "@/lib/store/fetch";
import type { Locale, StoreCategory, StoreProduct } from "@/lib/store/types";

async function fetchPublishedProductsServer(locale: Locale): Promise<StoreProduct[]> {
  const supabase = await createClient();

  const [categoriesRes, productsRes] = await Promise.all([
    supabase
      .from("store_categories")
      .select("id, locale, name, slug, sort_order")
      .eq("locale", locale)
      .order("sort_order", { ascending: true }),
    supabase
      .from("store_products")
      .select(PRODUCT_FIELDS)
      .eq("locale", locale)
      .eq("is_published", true)
      .order("sort_order", { ascending: true }),
  ]);

  if (categoriesRes.error) throw new Error(categoriesRes.error.message);
  if (productsRes.error) throw new Error(productsRes.error.message);

  const categories = (categoriesRes.data ?? []) as StoreCategory[];
  const byId = new Map(categories.map((c) => [c.id, c]));

  return ((productsRes.data ?? []) as ProductRow[]).map((row) => ({
    ...row,
    description: row.description ?? "",
    category_id: row.category_id ?? null,
    category: row.category_id ? (byId.get(row.category_id) ?? null) : null,
    source: row.source ?? null,
    source_handle: row.source_handle ?? null,
  }));
}

export function getCachedStoreProducts(locale: Locale) {
  return unstable_cache(
    () => fetchPublishedProductsServer(locale),
    [`store-products-${locale}`],
    { revalidate: STORE_REVALIDATE_SECONDS }
  )();
}
