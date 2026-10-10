"use client";

import { useStoreCart } from "@/components/store/StoreCart";
import { sellsOnSite } from "@/lib/store/sellsHere";
import BrandCtaButton from "@/components/ui/BrandCtaButton";
import { BRAND_CTA_BASE_CLASS } from "@/lib/brandCta";
import { minorToMajor } from "@/lib/square/money";
import { formatStorePrice } from "@/lib/store/formatPrice";
import type { StoreProduct } from "@/lib/store/types";
import { useState } from "react";
import { useTranslations } from "next-intl";

type Props = {
  product: StoreProduct;
  locale: string;
  appearance: "card" | "detail";
};

export default function AddToCart({ product, locale, appearance }: Props) {
  const t = useTranslations("tienda");
  const cart = useStoreCart();
  const options = (product.variations ?? []).filter((row) => row.amount > 0 && row.currency);
  const payable = cart.currency ? options.filter((row) => row.currency === cart.currency) : [];
  const [variationId, setVariationId] = useState(payable[0]?.id ?? options[0]?.id ?? "");
  const [added, setAdded] = useState(false);
  const referral = (product.referral_url || "").trim();
  if (!sellsOnSite(product) && referral) {
    return (
      <a
        className={appearance === "detail" ? `${BRAND_CTA_BASE_CLASS} brand-cta brand-cta--block` : "tienda-card__buy"}
        href={referral}
        target="_blank"
        rel="noopener noreferrer"
      >
        {t("visitStore")}
      </a>
    );
  }
  const selected = payable.find((row) => row.id === variationId) ?? payable[0];

  function add() {
    if (!selected || cart.status !== "ready") return;
    cart.add({
      ref: product.ref,
      variationId: selected.id,
      name: product.name,
      variationName: selected.name,
      unitAmount: selected.amount,
      currency: selected.currency,
      imageUrl: product.image_url,
    });
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1400);
  }

  const mismatch = cart.status === "ready" && options.length > 0 && payable.length === 0;
  const noPrice = options.length === 0;
  const label = added ? t("addedToCart") : t("addToCart");

  return (
    <div className={appearance === "detail" ? "square-checkout" : "tienda-card__cart"}>
      {payable.length > 1 ? (
        <label className="square-checkout__field">
          <span>{t("variationLabel")}</span>
          <select value={selected?.id ?? ""} onChange={(event) => setVariationId(event.target.value)}>
            {payable.map((variation) => (
              <option key={variation.id} value={variation.id}>
                {variation.name} · {formatStorePrice(minorToMajor(variation.amount, variation.currency), variation.currency, locale)}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      {appearance === "detail" ? (
        <BrandCtaButton disabled={!selected || added} onClick={add}>
          {label}
        </BrandCtaButton>
      ) : (
        <button type="button" className="tienda-card__buy" disabled={!selected || added} onClick={add}>
          {label}
        </button>
      )}

      {cart.status === "unavailable" ? <p className="tienda-detail__disclaimer">{t("paymentUnavailable")}</p> : null}
      {mismatch ? (
        <p className="tienda-detail__disclaimer">
          {t("cartCurrencyMismatch", { currency: options[0]?.currency ?? "", chargeCurrency: cart.currency ?? "" })}
        </p>
      ) : null}
      {noPrice ? <p className="tienda-detail__disclaimer">{t("cartNoPrice")}</p> : null}
    </div>
  );
}
