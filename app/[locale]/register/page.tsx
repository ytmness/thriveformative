"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import ThemeProvider from "@/components/theme/ThemeProvider";
import ThemeSwitcher from "@/components/theme/ThemeSwitcher";
import Header from "@/components/Header";
import BrandCtaLink from "@/components/ui/BrandCtaLink";
import { PABAU_BOOKING_URL } from "@/lib/pabau";

/** Public register deprecated: patients create accounts in Pabau while booking. */
export default function RegisterPage() {
  const t = useTranslations();
  const locale = useLocale();

  return (
    <ThemeProvider>
      <ThemeSwitcher />
      <Header />
      <main className="min-h-[70vh] flex items-center justify-center px-4 py-16">
        <div className="max-w-lg w-full text-center rounded-2xl border border-theme bg-surface p-8 md:p-10">
          <h1 className="font-display text-3xl mb-3">{t("auth.registerTitle")}</h1>
          <p className="type-ui-muted mb-8">{t("auth.registerSubtitle")}</p>
          <BrandCtaLink href={PABAU_BOOKING_URL} target="_blank" rel="noreferrer" block>
            {t("booking.portalCta")}
          </BrandCtaLink>
          <p className="mt-8 text-sm type-ui-muted">
            {t("auth.staffLoginHint")}{" "}
            <Link
              href={`/${locale}/admin/login`}
              className="text-[rgb(var(--primary))] underline underline-offset-2"
            >
              {t("auth.staffLogin")}
            </Link>
          </p>
          <p className="mt-5">
            <Link href={`/${locale}`} className="text-base type-ui-muted hover:underline">
              {t("auth.backHome")}
            </Link>
          </p>
        </div>
      </main>
    </ThemeProvider>
  );
}
