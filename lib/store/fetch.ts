import { createClient } from "@/lib/supabase";
import type { Locale, StoreCategory, StoreProduct } from "@/lib/store/types";

const PRODUCT_SELECT = `
  id,
  locale,
  sort_order,
  name,
  description,
  ref,
  referral_url,
  image_url,
  category_id,
  is_published,
  store_categories (
    id,
    locale,
    name,
    slug,
    sort_order
  )
`;

type ProductRow = Omit<StoreProduct, "category"> & {
  store_categories: StoreCategory | StoreCategory[] | null;
};

function mapCategory(raw: StoreCategory | StoreCategory[] | null): StoreCategory | null {
  if (!raw) return null;
  if (Array.isArray(raw)) return raw[0] ?? null;
  return raw;
}

function mapProduct(row: ProductRow): StoreProduct {
  const { store_categories, ...rest } = row;
  return {
    ...rest,
    description: rest.description ?? "",
    category_id: rest.category_id ?? null,
    category: mapCategory(store_categories),
  };
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

  let query = supabase
    .from("store_products")
    .select(PRODUCT_SELECT)
    .eq("locale", locale)
    .order("sort_order", { ascending: true });

  if (!includeUnpublished) {
    query = query.eq("is_published", true);
  }

  if (categorySlug) {
    const { data: cat } = await supabase
      .from("store_categories")
      .select("id")
      .eq("locale", locale)
      .eq("slug", categorySlug)
      .maybeSingle();

    if (!cat) return [];
    query = query.eq("category_id", cat.id);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  return ((data ?? []) as ProductRow[]).map(mapProduct);
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
    .select(PRODUCT_SELECT)
    .eq("locale", locale)
    .eq("ref", ref);

  if (!includeUnpublished) {
    query = query.eq("is_published", true);
  }

  const { data, error } = await query.maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;

  return mapProduct(data as ProductRow);
}
