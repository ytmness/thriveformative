"use client";

import ThemeProvider from "@/components/theme/ThemeProvider";
import ThemeSwitcher from "@/components/theme/ThemeSwitcher";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WaveDivider from "@/components/WaveDivider";
import ShapeScaleStorySection from "@/components/ShapeScaleStorySection";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import "@/app/styles/shapescale-story.css";

function ShapeScaleContent() {
  const t = useTranslations("shapescale");

  return (
    <>
      <ThemeSwitcher />
      <Header />

      <section className="shapescale-page-hero relative overflow-hidden">
        <motion.div className="shapescale-page-hero__gradient absolute inset-0 pointer-events-none" aria-hidden />
        <div className="relative z-10 mx-auto max-w-4xl px-6 py-14 text-center md:py-18">
          <motion.p
            className="text-xs font-semibold uppercase tracking-[0.28em] text-[rgb(var(--primary))]"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {t("eyebrow")}
          </motion.p>
          <motion.h1
            className="type-page-title mt-3 tracking-wide text-[rgb(var(--text))]"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.05 }}
          >
            {t("title")}
          </motion.h1>
          <motion.p
            className="type-page-lead mx-auto mt-4 max-w-2xl text-[rgb(var(--muted))]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.15 }}
          >
            {t("subtitle")}
          </motion.p>
        </div>
      </section>

      <main>
        <ShapeScaleStorySection />
      </main>

      <WaveDivider variant="primary" flip className="wave-divider--inside-section" />
      <Footer />
    </>
  );
}

export default function ShapeScalePage() {
  return (
    <ThemeProvider>
      <ShapeScaleContent />
    </ThemeProvider>
  );
}
