"use client";

import { useTranslations } from "next-intl";
import ContactForm from "@/components/ContactForm";
import ContactLocationMap from "@/components/ContactLocationMap";
import BrandCtaLink from "@/components/ui/BrandCtaLink";
import {
  CLINIC_ADDRESS_LINE,
  CLINIC_MAP_DIRECTIONS_URL,
  CLINIC_PHONE_DISPLAY,
  CLINIC_PHONE_TEL,
  WHATSAPP_LINK,
} from "@/lib/branding";
import "@/app/styles/contact-section.css";

export default function ContactSection() {
  const t = useTranslations();

  const email = t("contact.emailPlaceholder");

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
              <BrandCtaLink href={WHATSAPP_LINK} target="_blank" rel="noreferrer" block>
                {t("contact.scheduleBtn")}
              </BrandCtaLink>
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
                  <a href={CLINIC_PHONE_TEL}>{CLINIC_PHONE_DISPLAY}</a>
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
