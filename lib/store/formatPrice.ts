import type { StoreProduct } from "@/lib/store/types";

export function formatStorePrice(
  amount: number,
  currency: string | null | undefined,
  locale: string
): string {
  const code = currency || "USD";
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: code,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${code} ${amount.toFixed(2)}`;
  }
}

export function formatStoreProductPrice(
  product: Pick<StoreProduct, "price_min" | "price_max" | "currency">,
  locale: string,
  priceFromLabel: string
): string | null {
  if (product.price_min == null) return null;

  const formatted = formatStorePrice(product.price_min, product.currency, locale);
  if (product.price_max != null && product.price_max !== product.price_min) {
    return `${priceFromLabel} ${formatted}`;
  }
  return formatted;
}
