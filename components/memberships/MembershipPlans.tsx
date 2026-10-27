"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { BRAND_CTA_BASE_CLASS } from "@/lib/brandCta";
import { WHATSAPP_LINK } from "@/lib/branding";
import { readMarket } from "@/lib/site/market";

export type PublicPlan = {
  id: string;
  name: string;
  price: number;
  intervalUnit: "month" | "year" | "day90";
  description: string;
  items: { serviceName: string; quantity: number }[];
};

export default function MembershipPlans() {
  const t = useTranslations("plans");
  const locale = useLocale();
  const [plans, setPlans] = useState<PublicPlan[] | null>(null);
  const [currency, setCurrency] = useState("USD");

  useEffect(() => {
    const market = readMarket();
    fetch("/api/public/memberships")
      .then(async (response) => {
        const body = (await response.json()) as { ok?: boolean; plans?: PublicPlan[]; currency?: string };
        if (!response.ok || !body.ok) throw new Error("plans");
        setCurrency(body.currency || (market === "US" ? "USD" : "MXN"));
        setPlans(body.plans || []);
      })
      .catch(() => setPlans([]));
  }, []);

  function money(amount: number) {
    return amount.toLocaleString(locale, { style: "currency", currency, maximumFractionDigits: 0 });
  }

  if (!plans) return null;
  if (!plans.length) {
    return (
      <section className="plans-section">
        <div className="plans-section__intro">
          <p className="services-editorial-section__eyebrow">{t("eyebrow")}</p>
          <h2 className="plans-section__title">{t("title")}</h2>
          <p className="plans-section__subtitle">{t("empty")}</p>
          <a href={WHATSAPP_LINK} target="_blank" rel="noreferrer" className={`${BRAND_CTA_BASE_CLASS} brand-cta`} style={{ marginTop: "1.25rem" }}>
            {t("whatsappCta")}
          </a>
        </div>
      </section>
    );
  }

  const featuredId = plans.find((plan) => plan.intervalUnit === "month")?.id || plans[0]?.id;

  return (
    <section className="plans-section">
      <div className="plans-section__intro">
        <p className="services-editorial-section__eyebrow">{t("eyebrow")}</p>
        <h2 className="plans-section__title">{t("title")}</h2>
        <p className="plans-section__subtitle">{t("subtitle")}</p>
      </div>
      <div className={`plans-section__grid${plans.length < 3 ? " plans-section__grid--two" : ""}`}>
        {plans.map((plan) => {
          const featured = plan.id === featuredId;
          const monthly = plan.intervalUnit === "month";
          return (
            <article
              key={plan.id}
              className={`plan-card-plan ${featured ? "plan-card-plan--featured" : "plan-card-plan--side"}`}
            >
              {monthly ? <span className="plan-card-plan__badge">{t("monthlyBadge")}</span> : null}
              <div className="plan-card-plan__inner">
                <h3 className="plan-card-plan__title">{plan.name}</h3>
                <p className="plan-card-plan__price">
                  {money(plan.price)}
                  <span className="plan-card-plan__cadence">
                    {plan.intervalUnit === "year" ? t("cadenceYear") : plan.intervalUnit === "day90" ? t("cadence90") : t("cadenceMonth")}
                  </span>
                </p>
                {plan.items.length ? (
                  <ul className="plan-card-plan__list">
                    {plan.items.map((item) => (
                      <li key={`${plan.id}-${item.serviceName}`} className="plan-card-plan__item">
                        <span className="plan-card-plan__bullet" aria-hidden />
                        <span className="plan-card-plan__item-text">
                          {item.quantity} {item.serviceName}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : plan.description ? (
                  <p className="plan-card-plan__list">{plan.description}</p>
                ) : null}
                <Link
                  href={`/${locale}/suscribir?plan=${encodeURIComponent(plan.id)}`}
                  className={`${BRAND_CTA_BASE_CLASS} brand-cta plan-card-plan__btn`}
                >
                  {monthly ? t("subscribe") : t("buy")}
                </Link>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
