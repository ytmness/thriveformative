"use client";

import ThemeProvider from "@/components/theme/ThemeProvider";
import ThemeSwitcher from "@/components/theme/ThemeSwitcher";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WaveDivider from "@/components/WaveDivider";
import StoreCatalog from "@/components/store/StoreCatalog";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import "@/app/styles/tienda.css";

function TiendaContent() {
  const t = useTranslations("tienda");

  return (
    <>
      <ThemeSwitcher />
      <Header />

      <section className="tienda-page-hero relative overflow-hidden">
        <div className="tienda-page-hero__gradient absolute inset-0 pointer-events-none" aria-hidden />
        <div className="relative z-10 max-w-4xl mx-auto px-6 py-16 md:py-24 lg:py-28 text-center">
          <motion.p
            className="tienda-page-hero__eyebrow"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {t("eyebrow")}
          </motion.p>
          <motion.h1
            className="tienda-page-hero__title"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.05 }}
          >
            {t("pageTitle")}
          </motion.h1>
          <motion.p
            className="tienda-page-hero__lead"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.15 }}
          >
            {t("pageSubtitle")}
          </motion.p>
          <motion.div
            className="tienda-page-hero__rule"
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            aria-hidden
          />
        </div>
      </section>

      <WaveDivider variant="accent" />

      <main className="tienda-main max-w-7xl mx-auto px-6 py-16 md:py-24 lg:py-28">
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
