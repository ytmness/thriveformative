import type { StoreProduct } from "@/lib/store/types";

/** Normaliza texto para búsqueda insensible a acentos y mayúsculas. */
export function normalizeSearchText(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function productMatchesQuery(product: StoreProduct, rawQuery: string): boolean {
  const query = normalizeSearchText(rawQuery);
  if (!query) return true;

  const haystack = [
    product.name,
    product.description,
    product.category?.name ?? "",
    product.ref,
  ]
    .map(normalizeSearchText)
    .join(" ");

  return haystack.includes(query);
}
