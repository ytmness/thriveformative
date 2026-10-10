"use client";

import { BRAND_CTA_BASE_CLASS } from "@/lib/brandCta";
import { formatStorePrice } from "@/lib/store/formatPrice";
import type { StoreReceiptData } from "@/lib/store/orderTypes";
import { useEffect, useId, useRef, useState } from "react";
import "@/app/styles/brand-cta.css";

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

type PayLine = { ref: string; variationId: string; quantity: number };

export type CheckoutFulfillment =
  | { method: "pickup"; name: string; email: string; locationId: string }
  | {
      method: "shipping";
      name: string;
      email: string;
      line1: string;
      city: string;
      state: string;
      postalCode: string;
      country: "MX" | "US";
    };

type Props = {
  locale: string;
  lines: PayLine[];
  totalMajor: number;
  currency: string;
  fulfillment: CheckoutFulfillment | null;
  onPaid: (result: { receiptUrl: string | null; order: StoreReceiptData | null }) => void;
  labels: {
    payWithCard: string;
    payNow: string;
    paying: string;
    sandboxCardHint: string;
    paymentUnavailable: string;
    paymentFailed: string;
  };
};

type PayContext = {
  environment: "sandbox" | "production";
  applicationId: string;
  locationId: string;
  sdkUrl: string;
  currency: string;
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

export default function SquareCheckout({ locale, lines, totalMajor, currency, fulfillment, onPaid, labels }: Props) {
  const cardHostId = useId().replace(/:/g, "");
  const cardRef = useRef<SquareCard | null>(null);
  const [context, setContext] = useState<PayContext | null>(null);
  const [ready, setReady] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/square/checkout-context")
      .then(async (response) => {
        const body = (await response.json()) as PayContext & { ok?: boolean };
        if (!response.ok || !body.ok) throw new Error("unavailable");
        return body;
      })
      .then((body) => {
        if (!cancelled) setContext(body);
      })
      .catch(() => {
        if (!cancelled) setUnavailable(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

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

  async function pay() {
    if (!context || !cardRef.current || paying || !lines.length || !fulfillment) return;
    if (context.currency !== currency) {
      setError(labels.paymentFailed);
      return;
    }
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
          lines,
          fulfillment,
          sourceId: tokenResult.token,
          idempotencyKey: crypto.randomUUID(),
        }),
      });
      const body = (await response.json()) as {
        ok?: boolean;
        error?: string;
        receiptUrl?: string | null;
        order?: StoreReceiptData | null;
      };
      if (!response.ok || !body.ok) {
        setError(body.error || labels.paymentFailed);
        return;
      }
      onPaid({ receiptUrl: body.receiptUrl ?? null, order: body.order ?? null });
    } catch {
      setError(labels.paymentFailed);
    } finally {
      setPaying(false);
    }
  }

  if (unavailable) {
    return <p className="tienda-detail__disclaimer">{labels.paymentUnavailable}</p>;
  }

  if (!context) {
    return <div className="square-checkout__card animate-pulse" aria-hidden />;
  }

  const total = formatStorePrice(totalMajor, currency, locale);

  return (
    <div className="square-checkout">
      <p className="tienda-detail__eyebrow">{labels.payWithCard}</p>
      <div id={cardHostId} className="square-checkout__card" />
      <button
        type="button"
        className={`${BRAND_CTA_BASE_CLASS} brand-cta brand-cta--block`}
        disabled={!ready || paying || !lines.length || !fulfillment}
        onClick={() => void pay()}
      >
        <span>{paying ? labels.paying : `${labels.payNow} · ${total}`}</span>
      </button>
      {context.environment === "sandbox" ? <p className="tienda-detail__disclaimer">{labels.sandboxCardHint}</p> : null}
      {error ? <p className="square-checkout__error">{error}</p> : null}
    </div>
  );
}
