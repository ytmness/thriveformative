"use client";

import { BRAND_CTA_BASE_CLASS } from "@/lib/brandCta";
import { minorToMajor } from "@/lib/square/money";
import { formatStorePrice } from "@/lib/store/formatPrice";
import { useEffect, useId, useRef, useState } from "react";
import "@/app/styles/brand-cta.css";

type Variation = {
  id: string;
  name: string;
  amount: number;
  currency: string;
};

type CheckoutContext = {
  environment: "sandbox" | "production";
  applicationId: string;
  locationId: string;
  sdkUrl: string;
  productName: string;
  variations: Variation[];
};

type SquareCard = {
  attach: (selector: string) => Promise<void>;
  tokenize: () => Promise<{ status: string; token?: string; errors?: { message: string }[] }>;
  destroy: () => Promise<void>;
};

declare global {
  interface Window {
    Square?: {
      payments: (applicationId: string, locationId: string) => {
        card: () => Promise<SquareCard>;
      };
    };
  }
}

type Props = {
  locale: string;
  productRef: string;
  labels: {
    payWithCard: string;
    payNow: string;
    paying: string;
    paymentSuccess: string;
    paymentReceipt: string;
    sandboxCardHint: string;
    variationLabel: string;
    paymentUnavailable: string;
    paymentFailed: string;
  };
};

function loadSquareSdk(src: string): Promise<void> {
  if (window.Square) return Promise.resolve();
  const existing = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`);
  if (existing) {
    return new Promise((resolve, reject) => {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("square-sdk")), { once: true });
    });
  }
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("square-sdk"));
    document.head.appendChild(script);
  });
}

export default function SquareCheckout({ locale, productRef, labels }: Props) {
  const cardHostId = useId().replace(/:/g, "");
  const cardRef = useRef<SquareCard | null>(null);
  const [context, setContext] = useState<CheckoutContext | null>(null);
  const [variationId, setVariationId] = useState("");
  const [ready, setReady] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paid, setPaid] = useState(false);
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams({ locale, ref: productRef });
    fetch(`/api/square/checkout-context?${params}`)
      .then(async (response) => {
        const body = (await response.json()) as CheckoutContext & { ok?: boolean };
        if (!response.ok || !body.ok) throw new Error("unavailable");
        return body;
      })
      .then((body) => {
        if (cancelled) return;
        setContext(body);
        setVariationId(body.variations[0]?.id ?? "");
      })
      .catch(() => {
        if (!cancelled) setUnavailable(true);
      });
    return () => {
      cancelled = true;
    };
  }, [locale, productRef]);

  useEffect(() => {
    if (!context) return;
    let cancelled = false;
    const host = `#${CSS.escape(cardHostId)}`;

    loadSquareSdk(context.sdkUrl)
      .then(async () => {
        if (cancelled || !window.Square) throw new Error("square-sdk");
        const payments = window.Square.payments(context.applicationId, context.locationId);
        const card = await payments.card();
        await card.attach(host);
        if (cancelled) {
          await card.destroy();
          return;
        }
        cardRef.current = card;
        setReady(true);
      })
      .catch(() => {
        if (!cancelled) setUnavailable(true);
      });

    return () => {
      cancelled = true;
      const card = cardRef.current;
      cardRef.current = null;
      if (card) void card.destroy();
    };
  }, [context, cardHostId]);

  const selected = context?.variations.find((row) => row.id === variationId) ?? context?.variations[0];

  async function pay() {
    if (!context || !selected || !cardRef.current || paying) return;
    setPaying(true);
    setError(null);
    try {
      const tokenResult = await cardRef.current.tokenize();
      if (tokenResult.status !== "OK" || !tokenResult.token) {
        setError(tokenResult.errors?.[0]?.message || labels.paymentFailed);
        return;
      }

      const response = await fetch("/api/square/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locale,
          ref: productRef,
          variationId: selected.id,
          sourceId: tokenResult.token,
          idempotencyKey: crypto.randomUUID(),
        }),
      });
      const body = (await response.json()) as { ok?: boolean; error?: string; receiptUrl?: string | null };
      if (!response.ok || !body.ok) {
        setError(body.error || labels.paymentFailed);
        return;
      }
      setReceiptUrl(body.receiptUrl ?? null);
      setPaid(true);
    } catch {
      setError(labels.paymentFailed);
    } finally {
      setPaying(false);
    }
  }

  if (unavailable) {
    return <p className="tienda-detail__disclaimer">{labels.paymentUnavailable}</p>;
  }

  if (!context || !selected) {
    return <div className="square-checkout__card animate-pulse" aria-hidden />;
  }

  return (
    <div className="square-checkout">
      <p className="tienda-detail__eyebrow">{labels.payWithCard}</p>

      {context.variations.length > 1 ? (
        <label className="square-checkout__field">
          <span>{labels.variationLabel}</span>
          <select value={selected.id} onChange={(event) => setVariationId(event.target.value)}>
            {context.variations.map((variation) => (
              <option key={variation.id} value={variation.id}>
                {variation.name} · {formatStorePrice(minorToMajor(variation.amount, variation.currency), variation.currency, locale)}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      {paid ? (
        <div className="square-checkout__success">
          <p>{labels.paymentSuccess}</p>
          {receiptUrl ? (
            <a href={receiptUrl} target="_blank" rel="noopener noreferrer">
              {labels.paymentReceipt}
            </a>
          ) : null}
        </div>
      ) : (
        <>
          <div id={cardHostId} className="square-checkout__card" />
          <button
            type="button"
            className={`${BRAND_CTA_BASE_CLASS} brand-cta brand-cta--block`}
            disabled={!ready || paying}
            onClick={() => void pay()}
          >
            <span>
              {paying
                ? labels.paying
                : `${labels.payNow} · ${formatStorePrice(minorToMajor(selected.amount, selected.currency), selected.currency, locale)}`}
            </span>
          </button>
          {context.environment === "sandbox" ? (
            <p className="tienda-detail__disclaimer">{labels.sandboxCardHint}</p>
          ) : null}
        </>
      )}

      {error ? <p className="square-checkout__error">{error}</p> : null}
    </div>
  );
}
