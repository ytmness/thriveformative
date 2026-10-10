import { formatStoreProductPrice } from "@/lib/store/formatPrice";
import type { StoreProduct } from "@/lib/store/types";

type Props = {
  product: Pick<StoreProduct, "price_min" | "price_max" | "currency">;
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

  const rowClass =
    size === "detail" ? "tienda-detail__price-row" : "tienda-card__price-row";

  return (
    <div className={`${rowClass} ${className}`.trim()}>
      <span className="tienda-price-badge">{main}</span>
    </div>
  );
}
