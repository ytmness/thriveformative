"use client";

import ThemeProvider from "@/components/theme/ThemeProvider";
import ThemeSwitcher from "@/components/theme/ThemeSwitcher";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WaveDivider from "@/components/WaveDivider";
import SquareCheckout, { type CheckoutFulfillment } from "@/components/store/SquareCheckout";
import StoreReceipt from "@/components/store/StoreReceipt";
import { useStoreCart } from "@/components/store/StoreCart";
import { minorToMajor } from "@/lib/square/money";
import { formatStorePrice } from "@/lib/store/formatPrice";
import type { StoreReceiptData } from "@/lib/store/orderTypes";
import { Minus, Plus } from "lucide-react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { readMarket } from "@/lib/site/market";
import "@/app/styles/tienda.css";

function CheckoutContent() {
  const t = useTranslations("tienda");
  const locale = useLocale();
  const cart = useStoreCart();
  const [paidOrder, setPaidOrder] = useState<StoreReceiptData | null>(null);
  const [paid, setPaid] = useState(false);
  const [method, setMethod] = useState<"pickup" | "shipping">("pickup");
  const [locationId, setLocationId] = useState("");
  const [sites, setSites] = useState<{ id: string; name: string; city: string | null }[]>([]);
  const [pickupLines, setPickupLines] = useState<{ ref: string; locationIds: string[] }[]>([]);
  const [name, setName] = useState("");
  const [line1, setLine1] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState<"MX" | "US">("MX");

  useEffect(() => {
    setCountry(readMarket());
  }, []);
  const payable = cart.currency ? cart.lines.filter((line) => line.currency === cart.currency) : cart.lines;
  const blocked = cart.lines.filter((line) => cart.currency && line.currency !== cart.currency);
  const totalMinor = payable.reduce((sum, line) => sum + line.unitAmount * line.quantity, 0);
  const currency = cart.currency || payable[0]?.currency || "USD";
  const trimmedName = name.trim();
  const refsKey = payable.map((line) => line.ref).join(",");

  useEffect(() => {
    if (method !== "pickup" || !refsKey) {
      setSites([]);
      setPickupLines([]);
      return;
    }
    let cancelled = false;
    fetch(`/api/store/pickup?locale=${encodeURIComponent(locale)}&refs=${encodeURIComponent(refsKey)}`)
      .then(async (response) => {
        const body = (await response.json()) as {
          ok?: boolean;
          locations?: { id: string; name: string; city: string | null }[];
          lines?: { ref: string; locationIds: string[] }[];
        };
        if (!response.ok || !body.ok || cancelled) return;
        setSites(body.locations ?? []);
        setPickupLines(body.lines ?? []);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [method, locale, refsKey]);

  const pickupCovered =
    Boolean(locationId) &&
    payable.every((line) => pickupLines.find((row) => row.ref === line.ref)?.locationIds.includes(locationId));
  const shippingReady =
    trimmedName.length >= 2 &&
    line1.trim().length >= 3 &&
    city.trim().length >= 2 &&
    state.trim().length >= 2 &&
    postalCode.trim().length >= 3;
  const fulfillment: CheckoutFulfillment | null =
    method === "pickup"
      ? trimmedName.length >= 2 && pickupCovered
        ? { method: "pickup" as const, name: trimmedName, locationId }
        : null
      : shippingReady
        ? {
            method: "shipping",
            name: trimmedName,
            line1: line1.trim(),
            city: city.trim(),
            state: state.trim(),
            postalCode: postalCode.trim(),
            country,
          }
        : null;

  return (
    <>
      <ThemeSwitcher />
      <Header />
      <main className="tienda-main tienda-checkout mx-auto px-6 py-16 md:py-24">
        <Link
          href={`/${locale}/tienda`}
          className="type-ui text-sm text-[rgb(var(--primary))] hover:opacity-80 inline-flex items-center gap-1 mb-10"
        >
          ← {t("backToStore")}
        </Link>
        <h1 className="tienda-detail__title">{t("cartTitle")}</h1>

        {paid && paidOrder ? (
          <StoreReceipt
            data={paidOrder}
            labels={{
              receiptTitle: t("receiptTitle"),
              totalPaid: t("totalPaid"),
              thanksOrder: t("thanksOrder"),
              processingOrder: t("processingOrder"),
              printingReceipt: t("printingReceipt"),
              orderComplete: t("orderComplete"),
              pickup: t("pickup"),
              shipping: t("shipping"),
              home: t("receiptHome"),
            }}
            homeHref={`/${locale}`}
          />
        ) : paid ? (
          <div className="square-checkout__success mt-8">
            <p>{t("paymentSuccess")}</p>
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
                    <img
                      className="tienda-cart__photo"
                      src={line.imageUrl || "/pos/producto.svg"}
                      alt={line.imageUrl ? line.name : ""}
                      onError={(event) => {
                        const img = event.currentTarget;
                        if (img.dataset.fallback === "1") return;
                        img.dataset.fallback = "1";
                        img.src = "/pos/producto.svg";
                        img.alt = "";
                      }}
                    />
                    <div className="tienda-cart__copy">
                      <p className="tienda-cart__name">{line.name}</p>
                      {line.variationName && line.variationName !== "Estándar" ? (
                        <p className="tienda-cart__meta">{line.variationName}</p>
                      ) : null}
                      <p className="tienda-cart__meta">
                        {t("unitPrice")} · {formatStorePrice(unit, line.currency, locale)}
                      </p>
                      <p className="tienda-cart__meta">
                        {formatStorePrice(lineTotal, line.currency, locale)}
                      </p>
                    </div>
                    <div className="tienda-cart__actions">
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
                    </div>
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
              <aside className="tienda-cart__panel">
                <p className="tienda-cart__total">
                  {t("cartTotal")} · {formatStorePrice(minorToMajor(totalMinor, currency), currency, locale)}
                </p>
                <fieldset className="tienda-fulfill">
                  <legend className="tienda-fulfill__legend">{t("deliveryTitle")}</legend>
                  <div className="tienda-fulfill__choices">
                    <label className="tienda-fulfill__choice">
                      <input
                        type="radio"
                        name="delivery"
                        value="pickup"
                        checked={method === "pickup"}
                        onChange={() => setMethod("pickup")}
                      />
                      {t("pickup")}
                    </label>
                    <label className="tienda-fulfill__choice">
                      <input
                        type="radio"
                        name="delivery"
                        value="shipping"
                        checked={method === "shipping"}
                        onChange={() => setMethod("shipping")}
                      />
                      {t("shipping")}
                    </label>
                  </div>
                  <label className="tienda-fulfill__field">
                    <span>{t("recipientName")}</span>
                    <input value={name} autoComplete="name" onChange={(event) => setName(event.target.value)} />
                  </label>
                  {method === "pickup" ? (
                    <div className="tienda-fulfill__sites">
                      <p className="tienda-fulfill__warn">{t("pickupChoose")}</p>
                      {sites.map((site) => (
                        <label key={site.id} className="tienda-fulfill__choice tienda-fulfill__site">
                          <input
                            type="radio"
                            name="pickup-site"
                            value={site.id}
                            checked={locationId === site.id}
                            onChange={() => setLocationId(site.id)}
                          />
                          {site.name}
                          {site.city ? ` · ${site.city}` : ""}
                        </label>
                      ))}
                      {payable.map((line) => {
                        const available = pickupLines.find((row) => row.ref === line.ref)?.locationIds ?? [];
                        if (locationId && available.includes(locationId)) return null;
                        if (!available.length) {
                          return (
                            <p key={line.ref} className="tienda-fulfill__warn">
                              {line.name}: {t("pickupNone")}
                            </p>
                          );
                        }
                        if (!locationId) return null;
                        const names = sites.filter((site) => available.includes(site.id)).map((site) => site.name).join(", ");
                        return (
                          <p key={line.ref} className="tienda-fulfill__warn">
                            {line.name}: {t("pickupOnlyAt", { sites: names })}
                          </p>
                        );
                      })}
                      {sites.length > 0 &&
                      !sites.some((site) =>
                        payable.every((line) => pickupLines.find((row) => row.ref === line.ref)?.locationIds.includes(site.id))
                      ) ? (
                        <p className="tienda-fulfill__warn">{t("pickupUnavailable")}</p>
                      ) : null}
                    </div>
                  ) : null}
                  {method === "shipping" ? (
                    <>
                      <label className="tienda-fulfill__field">
                        <span>{t("addressLine")}</span>
                        <input value={line1} autoComplete="address-line1" onChange={(event) => setLine1(event.target.value)} />
                      </label>
                      <div className="tienda-fulfill__pair">
                        <label className="tienda-fulfill__field">
                          <span>{t("city")}</span>
                          <input value={city} autoComplete="address-level2" onChange={(event) => setCity(event.target.value)} />
                        </label>
                        <label className="tienda-fulfill__field">
                          <span>{t("state")}</span>
                          <input value={state} autoComplete="address-level1" onChange={(event) => setState(event.target.value)} />
                        </label>
                      </div>
                      <div className="tienda-fulfill__pair">
                        <label className="tienda-fulfill__field">
                          <span>{t("postalCode")}</span>
                          <input value={postalCode} autoComplete="postal-code" inputMode="text" onChange={(event) => setPostalCode(event.target.value)} />
                        </label>
                        <label className="tienda-fulfill__field">
                          <span>{t("country")}</span>
                          <select value={country} autoComplete="country" onChange={(event) => setCountry(event.target.value === "US" ? "US" : "MX")}>
                            <option value="MX">{t("countryMx")}</option>
                            <option value="US">{t("countryUs")}</option>
                          </select>
                        </label>
                      </div>
                    </>
                  ) : null}
                  {!fulfillment ? <p className="tienda-detail__disclaimer">{t("deliveryHint")}</p> : null}
                </fieldset>
                <SquareCheckout
                  locale={locale}
                  fulfillment={fulfillment}
                  lines={payable.map((line) => ({
                    ref: line.ref,
                    variationId: line.variationId,
                    quantity: line.quantity,
                  }))}
                  totalMajor={minorToMajor(totalMinor, currency)}
                  currency={currency}
                  onPaid={(result) => {
                    setPaidOrder(result.order);
                    setPaid(true);
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
              </aside>
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
