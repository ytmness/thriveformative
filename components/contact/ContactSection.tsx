"use client";

import { useTranslations } from "next-intl";
import { useState, useEffect } from "react";
import ContactForm from "@/components/ContactForm";
import ContactLocationMap from "@/components/ContactLocationMap";
import BrandCtaLink from "@/components/ui/BrandCtaLink";
import {
  CLINIC_ADDRESS_LINE,
  CLINIC_MAP_DIRECTIONS_URL,
  getClinicPhone,
  getWhatsAppLink,
} from "@/lib/branding";
import { PABAU_BOOKING_URL } from "@/lib/pabau";
import { readMarket } from "@/lib/site/market";
import "@/app/styles/contact-section.css";

export default function ContactSection() {
  const t = useTranslations();

  const email = t("contact.emailPlaceholder");
  const [phone, setPhone] = useState({ display: "+52 81 2003 6699", tel: "tel:+528120036699" });
  const [whatsappLink, setWhatsappLink] = useState<string | null>(null);

  useEffect(() => {
    const market = readMarket();
    const phoneData = getClinicPhone(market);
    setPhone({ display: phoneData.display, tel: phoneData.tel });
    setWhatsappLink(getWhatsAppLink(market));
  }, []);

  return (
    <section id="contacto" className="contact-section" aria-labelledby="contact-section-title">
      <div className="contact-section__inner">
        <header className="contact-section__header">
          <h2 id="contact-section-title" className="contact-section__title">
            {t("contact.title")}
          </h2>
          <p className="contact-section__subtitle">{t("contact.subtitle")}</p>
        </header>

        <div className="contact-section__grid">
          <article className="contact-section__card">
            <h3 className="contact-section__card-title">{t("contact.schedule")}</h3>
            <p className="contact-section__card-lead">{t("contact.scheduleDesc")}</p>
            <div className="contact-section__cta-wrap">
              <BrandCtaLink href={PABAU_BOOKING_URL} block>
                {t("contact.scheduleBtn")}
              </BrandCtaLink>
              {whatsappLink && (
                <a
                  href={whatsappLink}
                  target="_blank"
                  rel="noreferrer"
                  className="contact-section__whatsapp-secondary"
                >
                  {t("booking.whatsappCta")}
                </a>
              )}
            </div>
            <ul className="contact-section__details">
              <li>
                <span className="contact-section__detail-label">{t("contact.email")}</span>
                <span className="contact-section__detail-value">
                  <a href={`mailto:${email}`}>{email}</a>
                </span>
              </li>
              <li>
                <span className="contact-section__detail-label">{t("contact.phone")}</span>
                <span className="contact-section__detail-value">
                  <a href={phone.tel}>{phone.display}</a>
                </span>
              </li>
            </ul>
          </article>

          <article className="contact-section__card">
            <h3 className="contact-section__card-title">{t("contact.location")}</h3>
            <p className="contact-section__card-lead">{CLINIC_ADDRESS_LINE}</p>
            <div className="contact-section__map-block">
              <ContactLocationMap title={t("contact.mapTitle")} />
              <a
                href={CLINIC_MAP_DIRECTIONS_URL}
                target="_blank"
                rel="noreferrer"
                className="contact-location-map__link"
              >
                {t("contact.openInMaps")}
              </a>
            </div>
          </article>
        </div>

        <div className="contact-section__form-wrap">
          <div className="contact-section__form-card">
            <ContactForm embedded />
          </div>
        </div>
      </div>
    </section>
  );
}
