"use client";

import { useTranslations } from "next-intl";
import AnimatedSection from "@/components/AnimatedSection";
import { useCmsContext } from "@/components/cms/CmsProvider";
import { resolveCmsText } from "@/lib/cms/fetch";
import BrandCtaLink from "@/components/ui/BrandCtaLink";
import { WHATSAPP_LINK } from "@/lib/branding";
import { PABAU_BOOKING_URL, PABAU_WIDGET_URL } from "@/lib/pabau";

export default function BookingSection() {
  const t = useTranslations("booking");
  const { textOverrides } = useCmsContext();

  const bookingTitle = resolveCmsText(textOverrides, "booking.title", t("title"));
  const bookingSubtitle = resolveCmsText(
    textOverrides,
    "booking.subtitle",
    t("subtitle")
  );
  const portalHint = resolveCmsText(
    textOverrides,
    "booking.portalHint",
    t("portalHint")
  );
  const portalCta = resolveCmsText(
    textOverrides,
    "booking.portalCta",
    t("portalCta")
  );
  const durationNote = resolveCmsText(
    textOverrides,
    "booking.durationNote",
    t("durationNote")
  );
  const whatsappHint = resolveCmsText(
    textOverrides,
    "booking.whatsappHint",
    t("whatsappHint")
  );
  const whatsappCta = resolveCmsText(
    textOverrides,
    "booking.whatsappCta",
    t("whatsappCta")
  );

  return (
    <AnimatedSection>
      <section className="booking-section max-w-screen-2xl mx-auto px-4 sm:px-6 py-20 md:py-28">
        <header className="booking-section__header">
          <h2 className="booking-section__title">{bookingTitle}</h2>
          <p className="booking-section__subtitle">{bookingSubtitle}</p>
          <p className="booking-section__duration">{durationNote}</p>
        </header>

        <div className="booking-section__cta">
          <p className="booking-section__cta-hint">{portalHint}</p>
          <BrandCtaLink
            href={PABAU_BOOKING_URL}
            target="_blank"
            rel="noreferrer"
            className="booking-section__portal-btn"
          >
            {portalCta}
          </BrandCtaLink>
        </div>

        <div className="booking-embed">
          <iframe
            className="booking-embed__frame"
            src={PABAU_WIDGET_URL}
            title={t("embedTitle")}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allow="payment *"
          />
        </div>

        <div className="booking-section__secondary">
          <p className="booking-section__cta-hint booking-section__cta-hint--inline">
            {whatsappHint}
          </p>
          <a
            href={WHATSAPP_LINK}
            target="_blank"
            rel="noreferrer"
            className="booking-section__whatsapp-link"
          >
            {whatsappCta}
          </a>
        </div>
      </section>
    </AnimatedSection>
  );
}
