import { unstable_cache } from "next/cache";
import { fetchStoreProductsFromDb } from "@/lib/store/db";
import { STORE_REVALIDATE_SECONDS } from "@/lib/store/fetch";
import type { Locale, StoreProduct } from "@/lib/store/types";

async function fetchPublishedProductsServer(locale: Locale): Promise<StoreProduct[]> {
  return fetchStoreProductsFromDb(locale, { includeUnpublished: false });
}

export function getCachedStoreProducts(locale: Locale) {
  return unstable_cache(
    () => fetchPublishedProductsServer(locale),
    [`store-products-${locale}`],
    { revalidate: STORE_REVALIDATE_SECONDS }
  )();
}
