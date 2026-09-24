import type { ProductRow } from "@/lib/store/fields";
import type { Locale, StoreCategory, StoreProduct } from "@/lib/store/types";

export const STORE_REVALIDATE_SECONDS = 60;

export function attachCategoryToProduct(
  product: ProductRow,
  categories: StoreCategory[]
): StoreProduct {
  const byId = new Map(categories.map((c) => [c.id, c]));
  return {
    ...product,
    description: product.description ?? "",
    category_id: product.category_id ?? null,
    category: product.category_id ? (byId.get(product.category_id) ?? null) : null,
    source: product.source ?? null,
    source_handle: product.source_handle ?? null,
  };
}

async function storeApi<T>(path: string): Promise<T> {
  const res = await fetch(path, { credentials: "same-origin" });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((body as { error?: string }).error || `Store error ${res.status}`);
  return body as T;
}

export async function fetchStoreCategories(locale: Locale): Promise<StoreCategory[]> {
  if (typeof window === "undefined") {
    const { fetchStoreCategoriesFromDb } = await import("@/lib/store/db");
    return fetchStoreCategoriesFromDb(locale);
  }
  return storeApi(`/api/store/categories?locale=${encodeURIComponent(locale)}`);
}

export async function fetchStoreProducts(
  locale: Locale,
  options?: { includeUnpublished?: boolean; categorySlug?: string | null }
): Promise<StoreProduct[]> {
  if (typeof window === "undefined") {
    const { fetchStoreProductsFromDb } = await import("@/lib/store/db");
    return fetchStoreProductsFromDb(locale, options);
  }
  const params = new URLSearchParams({ locale });
  if (options?.includeUnpublished) params.set("all", "1");
  if (options?.categorySlug) params.set("category", options.categorySlug);
  return storeApi(`/api/store/products?${params.toString()}`);
}

export async function fetchStoreProductByRef(
  locale: Locale,
  ref: string,
  options?: { includeUnpublished?: boolean }
): Promise<StoreProduct | null> {
  if (typeof window === "undefined") {
    const { fetchStoreProductByRefFromDb } = await import("@/lib/store/db");
    return fetchStoreProductByRefFromDb(locale, ref, options);
  }
  const params = new URLSearchParams({ locale, ref });
  if (options?.includeUnpublished) params.set("all", "1");
  return storeApi(`/api/store/product?${params.toString()}`);
}
