"use client";

import ThemeProvider from "@/components/theme/ThemeProvider";
import ThemeSwitcher from "@/components/theme/ThemeSwitcher";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WaveDivider from "@/components/WaveDivider";
import ShapeScaleScrollSequence from "@/components/ShapeScaleScrollSequence";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";

function ShapeScaleContent() {
  const t = useTranslations("shapescale");

  return (
    <>
      <ThemeSwitcher />
      <Header />

      <section className="relative overflow-hidden border-b border-[rgb(var(--border)/0.12)]">
        <div className="absolute inset-0 bg-gradient-to-br from-[rgb(var(--bg))] via-[rgb(var(--surface)/0.4)] to-[rgb(var(--primary)/0.05)] pointer-events-none" />
        <div className="relative z-10 mx-auto max-w-4xl px-6 py-16 text-center md:py-20">
          <motion.h1
            className="type-page-title tracking-wide"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            {t("title")}
          </motion.h1>
          <motion.p
            className="type-page-lead mx-auto mt-4 max-w-2xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.15 }}
          >
            {t("subtitle")}
          </motion.p>
        </div>
      </section>

      <WaveDivider variant="accent" />

      <main>
        <ShapeScaleScrollSequence scrollHint={t("scrollHint")} sequenceLabel={t("sequenceLabel")} />
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
