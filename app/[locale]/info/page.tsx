"use client";

import ThemeProvider from "@/components/theme/ThemeProvider";
import ThemeSwitcher from "@/components/theme/ThemeSwitcher";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AnimatedSection from "@/components/AnimatedSection";
import WaveDivider from "@/components/WaveDivider";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";

const WHATSAPP_LINK = "https://wa.me/528120036699";

/* ───────────────────────────────────────────
   Info page content
   ─────────────────────────────────────────── */
function InfoContent() {
  const t = useTranslations();

  return (
    <>
      <ThemeSwitcher />
      <Header />

      {/* ─── PAGE BANNER ─── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[rgb(var(--bg))] via-[rgb(var(--bg))] to-[rgb(var(--primary)/0.06)] pointer-events-none" />
        <div className="relative z-10 max-w-4xl mx-auto px-6 py-20 md:py-28 text-center">
          <motion.h1
            className="font-display text-4xl md:text-5xl lg:text-6xl tracking-wide"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            {t("info.pageTitle")}
          </motion.h1>
          <motion.p
            className="mt-4 text-lg md:text-xl text-muted leading-relaxed max-w-2xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            {t("info.pageSubtitle")}
          </motion.p>
        </div>
      </section>

      <WaveDivider variant="accent" />

      <main>
        {/* ─── DOCTOR ─── */}
        <AnimatedSection>
          <section id="doctor" className="max-w-7xl mx-auto px-6 py-20 md:py-28">
            <SectionTitle title={t("doctor.title")} subtitle={t("doctor.subtitle")} />

            {/* Row 1: Photo card + Bio & Approach */}
            <div className="mt-10 grid md:grid-cols-[1fr_1.6fr] gap-8 items-start">
              {/* Left — Profile card */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                whileHover={{ y: -5, boxShadow: "0 20px 50px rgba(0,0,0,0.15)" }}
                className="bg-surface border border-theme rounded-2xl shadow-soft p-6"
              >
                <div className="h-64 rounded-xl bg-[rgb(var(--bg)/0.7)] border border-theme flex items-center justify-center text-muted text-base overflow-hidden">
                  Foto del doctor (placeholder)
                </div>
                <div className="mt-6 space-y-2">
                  <h3 className="font-display text-xl tracking-wide">{t("doctor.name")}</h3>
                  <div className="text-base font-medium" style={{ color: "rgb(var(--primary))" }}>
                    {t("doctor.specialty")}
                  </div>
                  <div className="text-sm text-muted">{t("doctor.subspecialty")}</div>
                  <div className="pt-3 border-t border-theme space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted">
                      <span className="w-1 h-1 rounded-full bg-[rgb(var(--primary))]" />
                      {t("doctor.location")}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted">
                      <span className="w-1 h-1 rounded-full bg-[rgb(var(--primary))]" />
                      {t("doctor.experience")}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted">
                      <span className="w-1 h-1 rounded-full bg-[rgb(var(--primary))]" />
                      {t("doctor.languages")}: {t("doctor.languagesList")}
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Right — Bio + Approach */}
              <div className="space-y-6">
                <motion.div
                  initial={{ opacity: 0, x: 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  whileHover={{ y: -4, boxShadow: "0 20px 50px rgba(0,0,0,0.15)" }}
                  className="bg-surface border border-theme rounded-2xl shadow-soft p-8"
                >
                  <p className="text-base leading-relaxed">{t("doctor.bio")}</p>
                  <div className="mt-6 pt-6 border-t border-theme">
                    <h4 className="font-display text-lg tracking-wide">{t("doctor.approach")}</h4>
                    <p className="mt-3 text-base text-muted leading-relaxed">{t("doctor.description")}</p>
                  </div>
                </motion.div>

                {/* Education & Certifications — side by side */}
                <div className="grid sm:grid-cols-2 gap-6">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.15 }}
                    whileHover={{ y: -4 }}
                    className="bg-surface border border-theme rounded-2xl shadow-soft p-6"
                  >
                    <h4 className="text-sm tracking-[0.15em] text-muted uppercase">{t("doctor.educationTitle")}</h4>
                    <ul className="mt-4 space-y-3">
                      <li className="text-sm leading-relaxed flex items-start gap-2">
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[rgb(var(--primary))] flex-shrink-0" />
                        {t("doctor.medSchool")}
                      </li>
                      <li className="text-sm leading-relaxed flex items-start gap-2">
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[rgb(var(--primary))] flex-shrink-0" />
                        {t("doctor.residency")}
                      </li>
                    </ul>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    whileHover={{ y: -4 }}
                    className="bg-surface border border-theme rounded-2xl shadow-soft p-6"
                  >
                    <h4 className="text-sm tracking-[0.15em] text-muted uppercase">{t("doctor.certificationsTitle")}</h4>
                    <ul className="mt-4 space-y-3">
                      <li className="text-sm leading-relaxed flex items-start gap-2">
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[rgb(var(--primary))] flex-shrink-0" />
                        {t("doctor.cert1")}
                      </li>
                      <li className="text-sm leading-relaxed flex items-start gap-2">
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[rgb(var(--primary))] flex-shrink-0" />
                        {t("doctor.cert2")}
                      </li>
                      <li className="text-sm text-muted mt-2">{t("doctor.npi")}</li>
                    </ul>
                  </motion.div>
                </div>
              </div>
            </div>

            {/* Row 2: Hospitals + Awards */}
            <div className="mt-8 grid sm:grid-cols-2 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.25 }}
                whileHover={{ y: -4 }}
                className="bg-surface border border-theme rounded-2xl shadow-soft p-6"
              >
                <h4 className="text-sm tracking-[0.15em] text-muted uppercase">{t("doctor.hospitalsTitle")}</h4>
                <ul className="mt-4 space-y-3">
                  <li className="text-base flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[rgb(var(--primary)/0.5)]" />
                    {t("doctor.hospital1")}
                  </li>
                  <li className="text-base flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[rgb(var(--primary)/0.5)]" />
                    {t("doctor.hospital2")}
                  </li>
                </ul>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.3 }}
                whileHover={{ y: -4 }}
                className="bg-surface border border-theme rounded-2xl shadow-soft p-6"
              >
                <h4 className="text-sm tracking-[0.15em] text-muted uppercase">{t("doctor.awardsTitle")}</h4>
                <ul className="mt-4 space-y-3">
                  <li className="text-base flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[rgb(var(--primary)/0.5)]" />
                    {t("doctor.award1")}
                  </li>
                  <li className="text-base flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[rgb(var(--primary)/0.5)]" />
                    {t("doctor.award2")}
                  </li>
                </ul>
              </motion.div>
            </div>

            {/* Row 3: Patient recognition badges */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.35 }}
              className="mt-8"
            >
              <h4 className="text-sm tracking-[0.15em] text-muted uppercase mb-5">{t("doctor.patientAwardsTitle")}</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: 0.35 + i * 0.06 }}
                    whileHover={{ scale: 1.06, y: -3 }}
                    className="bg-surface border border-theme rounded-xl p-4 text-center cursor-default"
                  >
                    <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-[rgb(var(--primary)/0.12)] flex items-center justify-center">
                      <div className="w-4 h-4 rounded-full bg-[rgb(var(--primary)/0.5)]" />
                    </div>
                    <div className="text-xs leading-tight text-muted">{t(`doctor.patientAward${i}`)}</div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </section>
        </AnimatedSection>

        <WaveDivider variant="subtle" flip />

        {/* ─── TESTIMONIALS ─── */}
        <AnimatedSection>
          <div className="section-elevated">
            <section className="max-w-7xl mx-auto px-6 py-20 md:py-28">
              <SectionTitle title={t("testimonials.title")} subtitle={t("testimonials.subtitle")} />
              <div className="mt-10 grid md:grid-cols-3 gap-8">
                <Quote text={t("testimonials.quote1")} delay={0} />
                <Quote text={t("testimonials.quote2")} delay={0.1} />
                <Quote text={t("testimonials.quote3")} delay={0.2} />
              </div>
            </section>
          </div>
        </AnimatedSection>

        {/* ─── CTA BANNER ─── */}
        <WaveDivider variant="primary" flip />
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[rgb(var(--primary)/0.08)] via-[rgb(var(--bg))] to-[rgb(var(--primary)/0.05)] pointer-events-none" />
          <div className="relative z-10 max-w-4xl mx-auto px-6 py-24 md:py-32 text-center">
            <AnimatedSection>
              <motion.h2
                className="font-display text-3xl md:text-4xl lg:text-5xl tracking-wide"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7 }}
              >
                {t("cta.title")}
              </motion.h2>
              <motion.p
                className="mt-5 text-lg md:text-xl text-muted leading-relaxed max-w-2xl mx-auto"
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: 0.15 }}
              >
                {t("cta.subtitle")}
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: 0.3 }}
                className="mt-10"
              >
                <motion.a
                  whileHover={{ scale: 1.04, y: -3 }}
                  whileTap={{ scale: 0.97 }}
                  href={WHATSAPP_LINK}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-cta inline-block rounded-xl px-12 py-5 text-lg tracking-wide shadow-xl"
                >
                  {t("cta.button")}
                </motion.a>
              </motion.div>
            </AnimatedSection>
          </div>
        </section>
        <WaveDivider variant="subtle" />

        {/* ─── FAQ ─── */}
        <AnimatedSection>
          <section id="faq" className="max-w-7xl mx-auto px-6 py-20 md:py-28">
            <SectionTitle title={t("faq.title")} subtitle={t("faq.subtitle")} />
            <div className="mt-10 space-y-4">
              <Faq q={t("faq.q1")} a={t("faq.a1")} delay={0} />
              <Faq q={t("faq.q2")} a={t("faq.a2")} delay={0.1} />
              <Faq q={t("faq.q3")} a={t("faq.a3")} delay={0.2} />
              <Faq q={t("faq.q4")} a={t("faq.a4")} delay={0.3} />
            </div>
          </section>
        </AnimatedSection>

        <WaveDivider variant="accent" flip />

        {/* ─── CONTACT ─── */}
        <AnimatedSection>
          <div className="section-elevated">
            <section id="contacto" className="max-w-7xl mx-auto px-6 py-20 md:py-28">
              <SectionTitle title={t("contact.title")} subtitle={t("contact.subtitle")} />
              <div className="mt-10 grid md:grid-cols-2 gap-8">
                <motion.div
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                  whileHover={{ y: -5, boxShadow: "0 20px 50px rgba(0,0,0,0.15)" }}
                  className="bg-surface border border-theme rounded-2xl shadow-soft p-8"
                >
                  <div className="text-base">
                    <div className="font-semibold">{t("contact.schedule")}</div>
                    <div className="text-muted">{t("contact.scheduleDesc")}</div>
                  </div>
                  <motion.a
                    whileHover={{ scale: 1.05, boxShadow: "0 10px 30px rgba(var(--primary), 0.3)" }}
                    whileTap={{ scale: 0.95 }}
                    className="mt-4 inline-block btn-primary rounded-xl px-5 py-3 text-sm font-semibold shadow-lg"
                    href={WHATSAPP_LINK}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {t("contact.scheduleBtn")}
                  </motion.a>

                  <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 }}
                    className="mt-6 text-sm"
                  >
                    <div className="font-semibold">{t("contact.email")}</div>
                    <div className="text-muted">{t("contact.emailPlaceholder")}</div>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 }}
                    className="mt-4 text-sm"
                  >
                    <div className="font-semibold">{t("contact.phone")}</div>
                    <div className="text-muted">{t("contact.phonePlaceholder")}</div>
                  </motion.div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  whileHover={{ y: -5, boxShadow: "0 20px 50px rgba(0,0,0,0.15)" }}
                  className="bg-surface border border-theme rounded-2xl shadow-soft p-8"
                >
                  <div className="text-base font-semibold">{t("contact.location")}</div>
                  <div className="text-muted text-base mt-2">{t("contact.locationDesc")}</div>
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="mt-4 h-64 rounded-xl bg-[rgb(var(--bg)/0.7)] border border-theme flex items-center justify-center text-muted text-sm overflow-hidden"
                  >
                    {t("contact.mapPlaceholder")}
                  </motion.div>
                </motion.div>
              </div>
            </section>
          </div>
        </AnimatedSection>
      </main>

      {/* ─── WAVE before footer ─── */}
      <WaveDivider variant="primary" flip />

      <Footer />
    </>
  );
}

export default function InfoPage() {
  return (
    <ThemeProvider>
      <InfoContent />
    </ThemeProvider>
  );
}

/* ═══════════════════════════════════════════
   Sub-components
   ═══════════════════════════════════════════ */

function SectionTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="mb-4"
    >
      <h2 className="font-display text-3xl md:text-4xl lg:text-5xl tracking-wide">{title}</h2>
      <p className="text-base md:text-lg text-muted mt-3 max-w-2xl leading-relaxed">{subtitle}</p>
    </motion.div>
  );
}

function Quote({ text, delay = 0 }: { text: string; delay?: number }) {
  const t = useTranslations();
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay }}
      whileHover={{ y: -4, boxShadow: "0 15px 40px rgba(0,0,0,0.15)" }}
      className="bg-surface border border-theme rounded-2xl shadow-soft p-8"
    >
      <div className="text-3xl leading-none mb-3" style={{ color: "rgb(var(--primary))" }}>&ldquo;</div>
      <p className="text-base leading-relaxed">{text}</p>
      <div className="text-sm text-muted mt-4 pt-4 border-t border-theme">{t("testimonials.author")}</div>
    </motion.div>
  );
}

function Faq({ q, a, delay = 0 }: { q: string; a: string; delay?: number }) {
  return (
    <motion.details
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ x: 4 }}
      className="bg-surface border border-theme rounded-2xl shadow-soft p-6 md:p-8 group"
    >
      <summary className="cursor-pointer font-display text-lg font-semibold">{q}</summary>
      <p className="mt-3 text-base text-muted leading-relaxed">{a}</p>
    </motion.details>
  );
}
