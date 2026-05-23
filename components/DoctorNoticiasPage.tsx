"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import ThemeSwitcher from "@/components/theme/ThemeSwitcher";
import NewsSection from "@/components/NewsSection";
import { CmsProvider } from "@/components/cms/CmsProvider";

export default function DoctorNoticiasPage({ locale }: { locale: string }) {
  const t = useTranslations("news");

  return (
    <div className="min-h-dvh h-dvh flex flex-col overflow-hidden bg-[rgb(var(--bg))] text-[rgb(var(--text))]">
      <header className="shrink-0 z-10 flex items-center justify-between gap-4 px-4 sm:px-6 h-14 border-b border-[rgb(var(--border)/0.22)] bg-[rgb(var(--bg)/0.92)] backdrop-blur-md">
        <Link
          href={`/${locale}`}
          className="text-sm font-medium text-[rgb(var(--muted))] hover:text-[rgb(var(--text))] transition-colors"
        >
          ← {t("backHome")}
        </Link>
        <ThemeSwitcher />
      </header>
      <main className="flex-1 min-h-0 flex flex-col p-3 sm:p-4 md:p-5 lg:p-6">
        <CmsProvider>
          <NewsSection />
        </CmsProvider>
      </main>
    </div>
  );
}
