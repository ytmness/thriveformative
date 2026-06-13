import { createClient } from "@/lib/supabase";
import type { Locale, StoreProduct } from "@/lib/store/types";

export async function fetchStoreProducts(
  locale: Locale,
  options?: { includeUnpublished?: boolean }
): Promise<StoreProduct[]> {
  const supabase = createClient();
  const includeUnpublished = options?.includeUnpublished ?? false;

  let query = supabase
    .from("store_products")
    .select(
      "id, locale, sort_order, name, description, ref, referral_url, image_url, is_published"
    )
    .eq("locale", locale)
    .order("sort_order", { ascending: true });

  if (!includeUnpublished) {
    query = query.eq("is_published", true);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  return ((data ?? []) as StoreProduct[]).map((row) => ({
    ...row,
    description: row.description ?? "",
  }));
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
    .select(
      "id, locale, sort_order, name, description, ref, referral_url, image_url, is_published"
    )
    .eq("locale", locale)
    .eq("ref", ref);

  if (!includeUnpublished) {
    query = query.eq("is_published", true);
  }

  const { data, error } = await query.maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;

  return {
    ...(data as StoreProduct),
    description: (data as StoreProduct).description ?? "",
  };
}
