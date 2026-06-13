"use client";

import ThemeProvider from "@/components/theme/ThemeProvider";
import ThemeSwitcher from "@/components/theme/ThemeSwitcher";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WaveDivider from "@/components/WaveDivider";
import StoreCatalog from "@/components/store/StoreCatalog";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";

function TiendaContent() {
  const t = useTranslations("tienda");

  return (
    <>
      <ThemeSwitcher />
      <Header />

      <section className="relative overflow-hidden border-b border-[rgb(var(--border)/0.12)]">
        <div className="absolute inset-0 bg-gradient-to-br from-[rgb(var(--bg))] via-[rgb(var(--surface)/0.4)] to-[rgb(var(--primary)/0.05)] pointer-events-none" />
        <div className="relative z-10 max-w-4xl mx-auto px-6 py-16 md:py-24 lg:py-28 text-center">
          <motion.p
            className="text-xs font-semibold uppercase tracking-[0.28em] text-[rgb(var(--primary))]"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {t("eyebrow")}
          </motion.p>
          <motion.h1
            className="type-page-title tracking-wide mt-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.05 }}
          >
            {t("pageTitle")}
          </motion.h1>
          <motion.p
            className="type-page-lead mt-4 max-w-2xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.15 }}
          >
            {t("pageSubtitle")}
          </motion.p>
        </div>
      </section>

      <WaveDivider variant="accent" />

      <main className="max-w-7xl mx-auto px-6 py-20 md:py-28">
        <StoreCatalog />
      </main>

      <WaveDivider variant="primary" flip />
      <Footer />
    </>
  );
}

export default function TiendaPage() {
  return (
    <ThemeProvider>
      <TiendaContent />
    </ThemeProvider>
  );
}
