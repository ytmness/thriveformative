"use client";

import ThemeProvider from "@/components/theme/ThemeProvider";
import ThemeSwitcher from "@/components/theme/ThemeSwitcher";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AnimatedSection from "@/components/AnimatedSection";
import WaveDivider from "@/components/WaveDivider";
import ContactForm from "@/components/ContactForm";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { WHATSAPP_LINK } from "@/lib/branding";

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
      <section className="info-page-hero relative overflow-hidden border-b border-[rgb(var(--border)/0.12)]">
        <div className="absolute inset-0 bg-gradient-to-br from-[rgb(var(--bg))] via-[rgb(var(--surface)/0.4)] to-[rgb(var(--primary)/0.05)] pointer-events-none" />
        <div className="relative z-10 max-w-4xl mx-auto px-6 py-16 md:py-24 lg:py-28 text-center">
          <motion.h1
            className="type-page-title tracking-wide"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            {t("info.pageTitle")}
          </motion.h1>
          <motion.p
            className="type-page-lead mt-4 max-w-2xl mx-auto"
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
                <div className="info-doctor-photo flex items-center justify-center overflow-hidden px-5 text-center">
                  <span className="type-caption text-[rgb(var(--muted))] tracking-[0.08em] uppercase">
                    {t("doctor.photoPlaceholder")}
                  </span>
                </div>
                <div className="mt-6 space-y-2">
                  <h3 className="type-card-name tracking-wide">{t("doctor.name")}</h3>
                  <div className="type-body font-medium" style={{ color: "rgb(var(--primary))" }}>
                    {t("doctor.specialty")}
                  </div>
                  <div className="type-ui-muted">{t("doctor.subspecialty")}</div>
                  <div className="pt-3 border-t border-theme space-y-2">
                    <div className="flex items-center gap-2 type-ui-muted">
                      <span className="w-1 h-1 rounded-full bg-[rgb(var(--primary))]" />
                      {t("doctor.location")}
                    </div>
                    <div className="flex items-center gap-2 type-ui-muted">
                      <span className="w-1 h-1 rounded-full bg-[rgb(var(--primary))]" />
                      {t("doctor.experience")}
                    </div>
                    <div className="flex items-center gap-2 type-ui-muted">
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
                  <p className="type-body">{t("doctor.bio")}</p>
                  <div className="mt-6 pt-6 border-t border-theme">
                    <h4 className="type-tech-title tracking-wide">{t("doctor.approach")}</h4>
                    <p className="type-body-muted mt-3">{t("doctor.description")}</p>
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
                    <h4 className="type-overline-tight">{t("doctor.educationTitle")}</h4>
                    <ul className="mt-4 space-y-3">
                      <li className="type-ui leading-relaxed flex items-start gap-2">
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[rgb(var(--primary))] flex-shrink-0" />
                        {t("doctor.medSchool")}
                      </li>
                      <li className="type-ui leading-relaxed flex items-start gap-2">
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
                    <h4 className="type-overline-tight">{t("doctor.certificationsTitle")}</h4>
                    <ul className="mt-4 space-y-3">
                      <li className="type-ui leading-relaxed flex items-start gap-2">
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[rgb(var(--primary))] flex-shrink-0" />
                        {t("doctor.cert1")}
                      </li>
                      <li className="type-ui leading-relaxed flex items-start gap-2">
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[rgb(var(--primary))] flex-shrink-0" />
                        {t("doctor.cert2")}
                      </li>
                      <li className="type-ui-muted mt-2">{t("doctor.npi")}</li>
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
                <h4 className="type-overline-tight">{t("doctor.hospitalsTitle")}</h4>
                <ul className="mt-4 space-y-3">
                  <li className="type-body flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[rgb(var(--primary)/0.5)]" />
                    {t("doctor.hospital1")}
                  </li>
                  <li className="type-body flex items-center gap-2">
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
                <h4 className="type-overline-tight">{t("doctor.awardsTitle")}</h4>
                <ul className="mt-4 space-y-3">
                  <li className="type-body flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[rgb(var(--primary)/0.5)]" />
                    {t("doctor.award1")}
                  </li>
                  <li className="type-body flex items-center gap-2">
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
              <h4 className="type-overline-tight mb-5">{t("doctor.patientAwardsTitle")}</h4>
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
                    <div className="type-caption leading-tight">{t(`doctor.patientAward${i}`)}</div>
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
                className="type-cta-title tracking-wide"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7 }}
              >
                {t("cta.title")}
              </motion.h2>
              <motion.p
                className="type-cta-sub mt-5 max-w-2xl mx-auto"
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
                  className="btn-cta type-btn inline-block rounded-xl px-12 py-5 shadow-xl"
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
                  <div className="type-body">
                    <div className="font-semibold">{t("contact.schedule")}</div>
                    <div className="text-muted">{t("contact.scheduleDesc")}</div>
                  </div>
                  <motion.a
                    whileHover={{ scale: 1.05, boxShadow: "0 10px 30px rgba(var(--primary), 0.3)" }}
                    whileTap={{ scale: 0.95 }}
                    className="mt-4 inline-block btn-primary type-btn rounded-xl px-5 py-3 shadow-lg"
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
                    className="mt-6 type-ui"
                  >
                    <div className="font-semibold">{t("contact.email")}</div>
                    <div className="text-muted">{t("contact.emailPlaceholder")}</div>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 }}
                    className="mt-4 type-ui"
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
                  <div className="type-body font-semibold">{t("contact.location")}</div>
                  <div className="text-muted type-body mt-2">{t("contact.locationDesc")}</div>
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="mt-4 h-64 rounded-xl bg-[rgb(var(--bg)/0.7)] border border-theme flex items-center justify-center type-ui-muted overflow-hidden"
                  >
                    {t("contact.mapPlaceholder")}
                  </motion.div>
                </motion.div>
              </div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="mt-8 max-w-2xl"
              >
                <ContactForm />
              </motion.div>
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
      <h2 className="type-section-title tracking-wide">{title}</h2>
      <p className="type-section-sub mt-3 max-w-2xl">{subtitle}</p>
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
      <p className="type-body">{text}</p>
      <div className="type-ui-muted mt-4 pt-4 border-t border-theme">{t("testimonials.author")}</div>
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
      <summary className="cursor-pointer type-faq-q">{q}</summary>
      <p className="type-body-muted mt-3">{a}</p>
    </motion.details>
  );
}
