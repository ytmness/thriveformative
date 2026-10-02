"use client";

import ThemeProvider from "@/components/theme/ThemeProvider";
import ThemeSwitcher from "@/components/theme/ThemeSwitcher";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WaveDivider from "@/components/WaveDivider";
import SquareCheckout from "@/components/store/SquareCheckout";
import { useStoreCart } from "@/components/store/StoreCart";
import { minorToMajor } from "@/lib/square/money";
import { formatStorePrice } from "@/lib/store/formatPrice";
import { Minus, Plus } from "lucide-react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import "@/app/styles/tienda.css";

function CheckoutContent() {
  const t = useTranslations("tienda");
  const locale = useLocale();
  const cart = useStoreCart();
  const [receiptUrl, setReceiptUrl] = useState<string | null | undefined>(undefined);
  const payable = cart.currency ? cart.lines.filter((line) => line.currency === cart.currency) : cart.lines;
  const blocked = cart.lines.filter((line) => cart.currency && line.currency !== cart.currency);
  const totalMinor = payable.reduce((sum, line) => sum + line.unitAmount * line.quantity, 0);
  const currency = cart.currency || payable[0]?.currency || "USD";
  const paid = receiptUrl !== undefined;

  return (
    <>
      <ThemeSwitcher />
      <Header />
      <main className="tienda-main max-w-3xl mx-auto px-6 py-16 md:py-24">
        <Link
          href={`/${locale}/tienda`}
          className="type-ui text-sm text-[rgb(var(--primary))] hover:opacity-80 inline-flex items-center gap-1 mb-10"
        >
          ← {t("backToStore")}
        </Link>
        <h1 className="tienda-detail__title">{t("cartTitle")}</h1>

        {paid ? (
          <div className="square-checkout__success mt-8">
            <p>{t("paymentSuccess")}</p>
            {receiptUrl ? (
              <a href={receiptUrl} target="_blank" rel="noopener noreferrer">
                {t("paymentReceipt")}
              </a>
            ) : null}
          </div>
        ) : payable.length === 0 && blocked.length === 0 ? (
          <div className="tienda-empty text-center py-16">
            <p className="type-body-muted">{t("cartEmpty")}</p>
            <Link
              href={`/${locale}/tienda`}
              className="inline-block mt-8 type-ui font-medium text-[rgb(var(--primary))] hover:opacity-80"
            >
              {t("backToStore")}
            </Link>
          </div>
        ) : (
          <div className="tienda-cart">
            <ul className="tienda-cart__lines">
              {payable.map((line) => {
                const unit = minorToMajor(line.unitAmount, line.currency);
                const lineTotal = unit * line.quantity;
                return (
                  <li key={`${line.ref}:${line.variationId}`} className="tienda-cart__line">
                    <div className="tienda-cart__copy">
                      <p className="tienda-cart__name">{line.name}</p>
                      {line.variationName && line.variationName !== "Estándar" ? (
                        <p className="tienda-cart__meta">{line.variationName}</p>
                      ) : null}
                      <p className="tienda-cart__meta">
                        {formatStorePrice(lineTotal, line.currency, locale)}
                      </p>
                    </div>
                    <div className="tienda-cart__qty">
                      <button
                        type="button"
                        aria-label={t("decreaseQty")}
                        onClick={() => cart.setQuantity(line.ref, line.variationId, line.quantity - 1)}
                      >
                        <Minus size={14} aria-hidden />
                      </button>
                      <span>{line.quantity}</span>
                      <button
                        type="button"
                        aria-label={t("increaseQty")}
                        onClick={() => cart.setQuantity(line.ref, line.variationId, line.quantity + 1)}
                      >
                        <Plus size={14} aria-hidden />
                      </button>
                    </div>
                    <button
                      type="button"
                      className="tienda-cart__remove"
                      onClick={() => cart.remove(line.ref, line.variationId)}
                    >
                      {t("cartRemove")}
                    </button>
                  </li>
                );
              })}
            </ul>

            {blocked.map((line) => (
              <p key={`${line.ref}:${line.variationId}`} className="tienda-detail__disclaimer">
                {line.name}: {t("cartCurrencyMismatch", { currency: line.currency, chargeCurrency: cart.currency ?? "" })}
              </p>
            ))}

            {payable.length > 0 ? (
              <>
                <p className="tienda-cart__total">
                  {t("cartTotal")} · {formatStorePrice(minorToMajor(totalMinor, currency), currency, locale)}
                </p>
                <SquareCheckout
                  locale={locale}
                  lines={payable.map((line) => ({
                    ref: line.ref,
                    variationId: line.variationId,
                    quantity: line.quantity,
                  }))}
                  totalMajor={minorToMajor(totalMinor, currency)}
                  currency={currency}
                  onPaid={(url) => {
                    setReceiptUrl(url);
                    cart.clear();
                  }}
                  labels={{
                    payWithCard: t("payWithCard"),
                    payNow: t("payNow"),
                    paying: t("paying"),
                    sandboxCardHint: t("sandboxCardHint"),
                    paymentUnavailable: t("paymentUnavailable"),
                    paymentFailed: t("paymentFailed"),
                  }}
                />
              </>
            ) : null}
          </div>
        )}
      </main>
      <WaveDivider variant="primary" flip />
      <Footer />
    </>
  );
}

export default function CheckoutPage() {
  return (
    <ThemeProvider>
      <CheckoutContent />
    </ThemeProvider>
  );
}
