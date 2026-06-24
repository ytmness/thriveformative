import {
  formatStorePrice,
  formatStoreProductPrice,
} from "@/lib/store/formatPrice";
import type { StoreProduct } from "@/lib/store/types";

type Props = {
  product: Pick<
    StoreProduct,
    "price_min" | "price_max" | "compare_at_price_min" | "currency"
  >;
  locale: string;
  priceFromLabel: string;
  className?: string;
  size?: "card" | "detail";
};

export default function StoreProductPrice({
  product,
  locale,
  priceFromLabel,
  className = "",
  size = "card",
}: Props) {
  const main = formatStoreProductPrice(product, locale, priceFromLabel);
  if (!main) return null;

  const compare =
    product.compare_at_price_min != null &&
    product.price_min != null &&
    product.compare_at_price_min > product.price_min
      ? formatStorePrice(product.compare_at_price_min, product.currency, locale)
      : null;

  const rowClass =
    size === "detail" ? "tienda-detail__price-row" : "tienda-card__price-row";

  return (
    <div className={`${rowClass} ${className}`.trim()}>
      <span className="tienda-price-badge">{main}</span>
      {compare ? <span className="tienda-price-compare">{compare}</span> : null}
    </div>
  );
}
