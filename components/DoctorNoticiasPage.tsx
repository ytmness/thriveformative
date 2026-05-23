"use client";

import { Suspense } from "react";
import Header from "@/components/Header";
import NewsSection from "@/components/NewsSection";
import ThemeSwitcher from "@/components/theme/ThemeSwitcher";
import { CmsProvider } from "@/components/cms/CmsProvider";
import "@/app/styles/header-nav.css";

export default function DoctorNoticiasPage({ locale }: { locale: string }) {
  return (
    <div className="min-h-dvh flex flex-col bg-[rgb(var(--bg))] text-[rgb(var(--text))]">
      <Header />
      <ThemeSwitcher />
      <main className="flex-1 w-full overflow-y-auto">
        <CmsProvider>
          <Suspense fallback={<div className="news-hub__contain p-8 text-muted">…</div>}>
            <NewsSection syncArticleInUrl />
          </Suspense>
        </CmsProvider>
      </main>
    </div>
  );
}
