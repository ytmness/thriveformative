"use client";

import { useTranslations } from "next-intl";
import { useState, useEffect } from "react";
import AnimatedSection from "@/components/AnimatedSection";
import { useCmsContext } from "@/components/cms/CmsProvider";
import { resolveCmsText } from "@/lib/cms/fetch";
import { getWhatsAppLink } from "@/lib/branding";
import { readMarket } from "@/lib/site/market";
import PublicCalendar from "@/components/booking/PublicCalendar";

export default function BookingSection() {
  const t = useTranslations("booking");
  const { textOverrides } = useCmsContext();
  const [whatsappLink, setWhatsappLink] = useState<string | null>(null);

  useEffect(() => {
    const market = readMarket();
    setWhatsappLink(getWhatsAppLink(market));
  }, []);

  const bookingTitle = resolveCmsText(textOverrides, "booking.title", t("title"));
  const bookingSubtitle = resolveCmsText(
    textOverrides,
    "booking.subtitle",
    t("subtitle")
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

        <PublicCalendar />

        {whatsappLink && (
          <div className="booking-section__secondary">
            <p className="booking-section__cta-hint booking-section__cta-hint--inline">
              {whatsappHint}
            </p>
            <a
              href={whatsappLink}
              target="_blank"
              rel="noreferrer"
              className="booking-section__whatsapp-link"
            >
              {whatsappCta}
            </a>
          </div>
        )}
      </section>
    </AnimatedSection>
  );
}
