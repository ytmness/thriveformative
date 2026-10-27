"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import SiteFrame from "@/components/site/SiteFrame";
import MembershipCheckout from "@/components/memberships/MembershipCheckout";
import type { PublicPlan } from "@/components/memberships/MembershipPlans";
import { BRAND_CTA_BASE_CLASS } from "@/lib/brandCta";
import { useUser } from "@/lib/useUser";
import "@/app/styles/tienda.css";
import "@/app/styles/brand-cta.css";

function cadenceLabel(unit: PublicPlan["intervalUnit"], t: (key: string) => string) {
  if (unit === "year") return t("cadenceYear");
  if (unit === "day90") return t("cadence90");
  return t("cadenceMonth");
}

function SubscribeContent() {
  const t = useTranslations("plans");
  const tStore = useTranslations("tienda");
  const locale = useLocale();
  const search = useSearchParams();
  const planId = search.get("plan") || "";
  const { user, loading: accountLoading } = useUser();
  const [plans, setPlans] = useState<PublicPlan[] | null>(null);
  const [currency, setCurrency] = useState("USD");
  const [done, setDone] = useState(false);
  const next = `/${locale}/suscribir${planId ? `?plan=${encodeURIComponent(planId)}` : ""}`;

  useEffect(() => {
    fetch("/api/public/memberships")
      .then(async (response) => {
        const body = (await response.json()) as { ok?: boolean; plans?: PublicPlan[]; currency?: string };
        if (!response.ok || !body.ok) throw new Error("plans");
        setPlans(body.plans || []);
        if (body.currency) setCurrency(body.currency);
      })
      .catch(() => setPlans([]));
  }, []);

  const plan = useMemo(
    () => (plans || []).find((item) => item.id === planId) || plans?.[0] || null,
    [plans, planId]
  );

  if (accountLoading || plans == null) {
    return <p className="booking-gate">{t("loading")}</p>;
  }

  if (!user) {
    return (
      <div className="booking-gate">
        <p className="booking-gate__title">{t("loginToSubscribe")}</p>
        <p className="booking-gate__hint">{t("loginToSubscribeHint")}</p>
        <div className="booking-gate__actions">
          <Link href={`/${locale}/register?next=${encodeURIComponent(next)}`} className="btn-primary">
            {tStore("registerToBuyCta")}
          </Link>
          <Link href={`/${locale}/login?next=${encodeURIComponent(next)}`} className="booking-gate__login">
            {tStore("loginToBuy")}
          </Link>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="booking-done">
        <h3>{t("success")}</h3>
        <Link href={`/${locale}/reservar`} className={`${BRAND_CTA_BASE_CLASS} brand-cta`} style={{ marginTop: "1rem" }}>
          {t("goBook")}
        </Link>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="booking-gate">
        <p className="booking-gate__title">{t("empty")}</p>
        <Link href={`/${locale}#suscripcion`} className="booking-gate__login">{t("back")}</Link>
      </div>
    );
  }

  const monthly = plan.intervalUnit === "month";

  return (
    <div className="membership-checkout">
      <p className="services-editorial-section__eyebrow">{monthly ? t("monthlyBadge") : t("eyebrow")}</p>
      <h1 className="type-page-title">{plan.name}</h1>
      <p className="visit-sheet__when">
        {plan.price.toLocaleString(locale, { style: "currency", currency, maximumFractionDigits: 0 })}
        {cadenceLabel(plan.intervalUnit, t)}
      </p>
      {plan.items.length ? (
        <ul className="plan-card-plan__list" style={{ maxWidth: "28rem", margin: "1.25rem auto 0" }}>
          {plan.items.map((item) => (
            <li key={item.serviceName} className="plan-card-plan__item">
              <span className="plan-card-plan__bullet" aria-hidden />
              <span className="plan-card-plan__item-text">
                {item.quantity} {item.serviceName}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
      <div style={{ maxWidth: "28rem", margin: "1.75rem auto 0", textAlign: "left" }}>
        <MembershipCheckout
          membershipId={plan.id}
          totalMajor={plan.price}
          currency={currency}
          locale={locale}
          onPaid={() => setDone(true)}
          labels={{
            payWithCard: tStore("payWithCard"),
            payNow: monthly ? t("subscribe") : t("buy"),
            paying: tStore("paying"),
            sandboxCardHint: tStore("sandboxCardHint"),
            paymentUnavailable: tStore("paymentUnavailable"),
            paymentFailed: tStore("paymentFailed"),
          }}
        />
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <SiteFrame>
      <Suspense fallback={<p className="booking-gate">…</p>}>
        <SubscribeContent />
      </Suspense>
    </SiteFrame>
  );
}
