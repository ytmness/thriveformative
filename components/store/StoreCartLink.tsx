"use client";

import { useStoreCart } from "@/components/store/StoreCart";
import { ShoppingBag } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

export default function StoreCartLink() {
  const t = useTranslations("tienda");
  const locale = useLocale();
  const { count } = useStoreCart();

  return (
    <a href={`/${locale}/tienda/checkout`} className="site-nav__cart" aria-label={t("cartLabel")}>
      <ShoppingBag size={18} strokeWidth={2} aria-hidden />
      {count > 0 ? <span className="site-nav__cart-count">{count > 99 ? "99+" : count}</span> : null}
    </a>
  );
}
