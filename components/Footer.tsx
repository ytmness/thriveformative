"use client";

import { motion } from "framer-motion";
import { useTheme } from "@/components/theme/ThemeProvider";
import { useTranslations, useLocale } from "next-intl";
import { useScrollDirection } from "@/lib/useScrollDirection";
import { LATERAL } from "@/lib/lateralAnimation";

const WHATSAPP_LINK = "https://google.com";

const logoMap: Record<string, string> = {
  "golden-sand": "/logos/Logo-Golden-Sand-color-06.png",
  nocturnal: "/logos/Recurso-6-5x.png",
  metals: "/logos/Recurso-7-5x.png",
  "earth-modern": "/logos/Recurso-8-5x.png",
};

export default function Footer() {
  const { theme } = useTheme();
  const t = useTranslations();
  const locale = useLocale();
  const scrollDirection = useScrollDirection();
  const fromY = scrollDirection === "down" ? LATERAL.fromY : -LATERAL.fromY;

  const currentLogo = logoMap[theme] || logoMap["nocturnal"];

  const quickLinks = [
    { label: t("footer.linkHome"), href: `/${locale}#inicio` },
    { label: t("footer.linkServices"), href: `/${locale}#servicios` },
    { label: t("footer.linkPlans"), href: `/${locale}#planes` },
    { label: t("footer.linkDoctor"), href: `/${locale}/info#doctor` },
    { label: t("footer.linkFaq"), href: `/${locale}/info#faq` },
  ];

  return (
    <motion.footer
      initial={{ opacity: 0, y: fromY }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: false, amount: 0.02 }}
      transition={{ duration: LATERAL.durationFlower, ease: LATERAL.ease }}
      className="py-16 md:py-20 border-t border-theme"
    >
      <div className="max-w-7xl mx-auto px-6">
        {/* Footer grid */}
        <div className="grid md:grid-cols-3 gap-12 md:gap-16">
          {/* Brand column */}
          <div className="space-y-4">
            <motion.img
              whileHover={{ scale: 1.02 }}
              src={currentLogo}
              alt="Thrive Formative"
              className="h-14 md:h-16 w-auto object-contain"
            />
            <p className="text-sm text-muted leading-relaxed max-w-xs">
              {t("footer.tagline")}
            </p>
            <div className="text-xs tracking-[0.18em] text-muted pt-2">
              {t("footer.brand")}
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="font-display text-sm tracking-[0.15em] uppercase mb-5">
              {t("footer.quickLinks")}
            </h4>
            <nav className="space-y-3">
              {quickLinks.map((link) => (
                <motion.a
                  key={link.href}
                  href={link.href}
                  whileHover={{ x: 4, color: "rgb(var(--primary))" }}
                  className="block text-sm text-muted hover:opacity-80 transition-all"
                >
                  {link.label}
                </motion.a>
              ))}
            </nav>
          </div>

          {/* Contact column */}
          <div>
            <h4 className="font-display text-sm tracking-[0.15em] uppercase mb-5">
              {t("footer.contactTitle")}
            </h4>
            <div className="space-y-3 text-sm text-muted">
              <div>{t("contact.emailPlaceholder")}</div>
              <div>{t("contact.phonePlaceholder")}</div>
              <div>{t("contact.locationDesc")}</div>
            </div>
            <motion.a
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              href={WHATSAPP_LINK}
              target="_blank"
              rel="noreferrer"
              className="mt-5 inline-block btn-primary rounded-xl px-6 py-3 text-sm font-medium shadow-lg"
            >
              {t("contact.scheduleBtn")}
            </motion.a>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-14 pt-6 border-t border-theme flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="text-xs text-muted">
            © {new Date().getFullYear()} Thrive Formative. {t("footer.rights")}
          </div>
          <div className="text-xs text-muted tracking-wide">
            Designed with care
          </div>
        </div>
      </div>
    </motion.footer>
  );
}
