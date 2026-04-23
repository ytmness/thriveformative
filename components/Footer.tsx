"use client";

import { useTranslations, useLocale } from "next-intl";
import { SITE_LOGO_SRC } from "@/lib/branding";

const WHATSAPP_LINK = "https://google.com";

export default function Footer() {
  const t = useTranslations();
  const locale = useLocale();

  const quickLinks = [
    { label: t("footer.linkHome"), href: `/${locale}#inicio` },
    { label: t("footer.linkServices"), href: `/${locale}#servicios` },
    { label: t("footer.linkPlans"), href: `/${locale}#planes` },
    { label: t("footer.linkDoctor"), href: `/${locale}/info#doctor` },
    { label: t("footer.linkFaq"), href: `/${locale}/info#faq` },
    { label: t("footer.linkContact"), href: `/${locale}/info#contacto` },
  ];

  return (
    <footer className="py-16 md:py-20 border-t border-theme">
      <div className="max-w-7xl mx-auto px-6">
        {/* Footer grid */}
        <div className="grid md:grid-cols-3 gap-12 md:gap-16">
          {/* Brand column */}
          <div className="space-y-4">
            <img
              src={SITE_LOGO_SRC}
              alt="Thrive Formative"
              className="h-14 md:h-16 w-auto object-contain transition-transform duration-200 hover:scale-[1.02]"
            />
            <p className="type-ui-muted leading-relaxed max-w-xs">
              {t("footer.tagline")}
            </p>
            <div className="type-caption tracking-[0.18em] pt-2">
              {t("footer.brand")}
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="font-display type-overline-tight mb-5">
              {t("footer.quickLinks")}
            </h4>
            <nav className="space-y-3">
              {quickLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="block type-ui-muted hover:opacity-80 transition-all hover:translate-x-1 hover:text-[rgb(var(--primary))]"
                >
                  {link.label}
                </a>
              ))}
            </nav>
          </div>

          {/* Contact column */}
          <div>
            <h4 className="font-display type-overline-tight mb-5">
              {t("footer.contactTitle")}
            </h4>
            <div className="space-y-3 type-ui-muted">
              <div>{t("contact.emailPlaceholder")}</div>
              <div>{t("contact.phonePlaceholder")}</div>
              <div>{t("contact.locationDesc")}</div>
            </div>
            <a
              href={WHATSAPP_LINK}
              target="_blank"
              rel="noreferrer"
              className="mt-5 inline-block btn-primary type-btn rounded-xl px-6 py-3 shadow-lg transition-transform hover:scale-[1.03] active:scale-[0.97]"
            >
              {t("contact.scheduleBtn")}
            </a>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-14 pt-6 border-t border-theme flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="type-caption">
            © {new Date().getFullYear()} Thrive Formative. {t("footer.rights")}
          </div>
          <div className="type-caption tracking-wide">
            Designed with care
          </div>
        </div>
      </div>
    </footer>
  );
}
