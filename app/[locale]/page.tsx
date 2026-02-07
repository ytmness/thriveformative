"use client";

import ThemeProvider from "@/components/theme/ThemeProvider";
import ThemeSwitcher from "@/components/theme/ThemeSwitcher";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LoadingScreen from "@/components/LoadingScreen";
import AnimatedSection from "@/components/AnimatedSection";
import WaveDivider from "@/components/WaveDivider";
import BookingSection from "@/components/BookingSection";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";

const WHATSAPP_LINK = "https://google.com";

/* ───────────────────────────────────────────
   Decorative SVG – organic line-art pattern
   behind the hero circle (mandala-esque)
   ─────────────────────────────────────────── */
function OrganicPattern({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 500 500"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`hero-organic-pattern ${className}`}
    >
      <g stroke="rgb(var(--primary))" strokeWidth="0.7" opacity="0.07">
        {/* Concentric rings */}
        <circle cx="250" cy="250" r="245" />
        <circle cx="250" cy="250" r="210" />
        <circle cx="250" cy="250" r="175" />
        <circle cx="250" cy="250" r="140" />
        {/* Cardinal petals */}
        <path d="M250,5 Q320,130 250,250 Q180,130 250,5" />
        <path d="M250,495 Q320,370 250,250 Q180,370 250,495" />
        <path d="M5,250 Q130,320 250,250 Q130,180 5,250" />
        <path d="M495,250 Q370,320 250,250 Q370,180 495,250" />
        {/* Diagonal petals */}
        <path d="M75,75 Q200,170 250,250 Q170,200 75,75" />
        <path d="M425,75 Q300,170 250,250 Q330,200 425,75" />
        <path d="M75,425 Q200,330 250,250 Q170,300 75,425" />
        <path d="M425,425 Q300,330 250,250 Q330,300 425,425" />
        {/* Flowing arcs */}
        <path d="M50,150 C150,100 200,200 250,250" />
        <path d="M450,150 C350,100 300,200 250,250" />
        <path d="M50,350 C150,400 200,300 250,250" />
        <path d="M450,350 C350,400 300,300 250,250" />
      </g>
    </svg>
  );
}

/* ───────────────────────────────────────────
   Landing page content
   ─────────────────────────────────────────── */
function PageContent() {
  const t = useTranslations();

  return (
    <>
      <LoadingScreen />
      <ThemeSwitcher />
      <Header />

      {/* ─── HERO ─── */}
      <section id="inicio" className="relative flex flex-col min-h-[calc(100vh-5rem)] overflow-hidden">
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-[rgb(var(--bg))] via-[rgb(var(--bg))] to-[rgb(var(--primary)/0.04)] pointer-events-none" />

        <div className="relative z-10 flex-1 max-w-7xl mx-auto px-6 py-12 md:py-16 lg:py-20 grid md:grid-cols-2 gap-12 lg:gap-16 items-center w-full">
          {/* LEFT — Decorative circle with logo */}
          <AnimatedSection direction="left">
            <div className="flex justify-center">
              <div className="relative">
                {/* Organic pattern behind circle */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <OrganicPattern className="w-[130%] h-[130%] text-[rgb(var(--primary))]" />
                </div>

                {/* Glow behind circle */}
                <div className="hero-circle-glow absolute inset-0 rounded-full bg-[rgb(var(--primary)/0.12)] blur-3xl scale-110 pointer-events-none" />

                {/* Main circle */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                  className="relative w-64 h-64 md:w-80 md:h-80 lg:w-96 lg:h-96 rounded-full border border-[rgb(var(--primary)/0.25)] overflow-hidden flex items-center justify-center bg-[rgb(var(--surface)/0.3)] backdrop-blur-sm"
                >
                  {/* Inner ring */}
                  <div className="absolute inset-2 rounded-full border border-[rgb(var(--primary)/0.12)]" />

                  <img
                    src="/logos/t-shape-2-1.png"
                    alt="T-Shape 2"
                    className="w-3/4 h-3/4 object-contain relative z-10"
                  />
                </motion.div>
              </div>
            </div>
          </AnimatedSection>

          {/* RIGHT — Text content */}
          <div>
            <motion.h1
              className="font-display text-4xl sm:text-5xl md:text-6xl leading-tight tracking-wide italic"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              {t("hero.title")}
            </motion.h1>

            <motion.p
              className="mt-5 text-muted text-lg leading-relaxed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              {t("hero.subtitle")}
            </motion.p>

            {/* Benefits grid — 2×2 like reference */}
            <motion.div
              className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.55 }}
            >
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="benefit-dot relative mt-1.5 w-4 h-4 rounded-full bg-[rgb(var(--primary)/0.2)] flex items-center justify-center flex-shrink-0">
                    <div className="w-1.5 h-1.5 rounded-full bg-[rgb(var(--primary))]" />
                  </div>
                  <span className="text-base leading-snug">{t(`hero.benefit${i}`)}</span>
                </div>
              ))}
            </motion.div>

            {/* CTA button */}
            <motion.div
              className="mt-9"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.7 }}
            >
              <motion.a
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.97 }}
                href={WHATSAPP_LINK}
                target="_blank"
                rel="noreferrer"
                className="btn-cta inline-block rounded-xl px-10 py-5 text-base tracking-wide shadow-lg"
              >
                {t("hero.scheduleBtn")}
              </motion.a>
            </motion.div>
          </div>
        </div>

        {/* Wave al fondo del hero — visible sin scroll */}
        <div className="relative z-10 w-full mt-auto flex-shrink-0">
          <WaveDivider variant="accent" className="wave-hero-bottom" />
        </div>
      </section>

      {/* ─── STATS BAR ─── */}
      <AnimatedSection>
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="grid grid-cols-3 gap-6">
            <Stat label={t("hero.stat1Label")} value={t("hero.stat1Value")} delay={0} />
            <Stat label={t("hero.stat2Label")} value={t("hero.stat2Value")} delay={0.1} />
            <Stat label={t("hero.stat3Label")} value={t("hero.stat3Value")} delay={0.2} />
          </div>
        </div>
      </AnimatedSection>

      {/* ─── FLOW CARD ─── */}
      <AnimatedSection delay={0.1}>
        <div className="max-w-7xl mx-auto px-6 pb-14">
          <motion.div
            whileHover={{ y: -4, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}
            transition={{ duration: 0.3 }}
            className="bg-surface border border-theme rounded-2xl shadow-soft p-8"
          >
            <div className="text-sm text-muted tracking-[0.22em]">{t("flow.title")}</div>
            <ul className="mt-4 space-y-3 text-base leading-relaxed">
              <li>{t("flow.newPatient")}</li>
              <li>{t("flow.followUp")}</li>
              <li>{t("flow.policies")}</li>
            </ul>
            <div className="mt-6 p-5 rounded-xl border border-theme bg-[rgb(var(--bg)/0.6)]">
              <div className="text-sm text-muted">{t("flow.script")}</div>
              <p className="text-base mt-2">&ldquo;{t("flow.scriptText")}&rdquo;</p>
            </div>
          </motion.div>
        </div>
      </AnimatedSection>

      {/* ─── MAIN CONTENT ─── */}
      <main>
        {/* APPROACH CARDS — wave dentro de la sección para que la abrace */}
        <AnimatedSection>
          <div className="section-elevated">
            <WaveDivider variant="subtle" flip className="wave-divider--inside-section" />
            <div className="max-w-7xl mx-auto px-6 py-20 md:py-28">
              <div className="grid md:grid-cols-3 gap-8">
                <Card title={t("approach.title1")} delay={0}>
                  {t("approach.desc1")}
                </Card>
                <Card title={t("approach.title2")} delay={0.1}>
                  {t("approach.desc2")}
                </Card>
                <Card title={t("approach.title3")} delay={0.2}>
                  {t("approach.desc3")}
                </Card>
              </div>
            </div>
          </div>
        </AnimatedSection>

        {/* SERVICES — wave dentro de la sección para que la abrace */}
        <AnimatedSection>
          <section id="servicios">
            <WaveDivider variant="subtle" className="wave-divider--inside-section wave-divider--pull-up" />
            <div className="max-w-7xl mx-auto px-6 py-20 md:py-28">
              <SectionTitle title={t("services.title")} subtitle={t("services.subtitle")} />
              <div className="mt-10 grid md:grid-cols-2 gap-8">
                <Service name={t("services.service1")} desc={t("services.desc1")} delay={0} />
                <Service name={t("services.service2")} desc={t("services.desc2")} delay={0.1} />
                <Service name={t("services.service3")} desc={t("services.desc3")} delay={0.2} />
                <Service name={t("services.service4")} desc={t("services.desc4")} delay={0.3} />
                <Service name={t("services.service5")} desc={t("services.desc5")} delay={0.4} />
                <Service name={t("services.service6")} desc={t("services.desc6")} delay={0.5} />
              </div>
            </div>
          </section>
        </AnimatedSection>

        {/* T-SHAPE 2 — wave dentro de la sección para que la abrace */}
        <AnimatedSection>
          <div className="section-elevated">
            <WaveDivider variant="subtle" flip className="wave-divider--inside-section" />
            <section id="tshape" className="max-w-7xl mx-auto px-6 py-20 md:py-28">
              <SectionTitle title={t("tshape.title")} subtitle={t("tshape.subtitle")} />

              <div className="mt-10 grid md:grid-cols-[1fr_1.4fr] gap-10 items-start">
                {/* Left — Machine image + FDA badge overlay */}
                <motion.div
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                  className="relative"
                >
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="bg-surface border border-theme rounded-2xl shadow-soft p-6 flex items-center justify-center"
                  >
                    <img
                      src="/logos/t-shape-2-1.png"
                      alt="T-Shape 2"
                      className="w-full max-w-[280px] h-auto object-contain"
                    />
                  </motion.div>
                  {/* FDA seal — positioned as stamp on top-right */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.5, rotate: -15 }}
                    whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.3, type: "spring", stiffness: 150 }}
                    className="absolute -top-8 -right-8 w-32 h-32 md:w-40 md:h-40"
                  >
                    <img
                      src="/logos/fda-approved.png"
                      alt={t("tshape.fdaBadge")}
                      className="w-full h-full object-contain drop-shadow-lg"
                      style={{ filter: "invert(1) sepia(0.3) saturate(2.5) hue-rotate(345deg) brightness(0.82)" }}
                    />
                  </motion.div>
                </motion.div>

                {/* Right — FDA info + indications */}
                <motion.div
                  initial={{ opacity: 0, x: 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  className="bg-surface border border-theme rounded-2xl shadow-soft p-6"
                >
                  <p className="text-base leading-relaxed">{t("tshape.fdaDesc")}</p>
                  <ul className="mt-5 space-y-3">
                    {[1, 2, 3, 4].map((i) => (
                      <li key={i} className="flex items-center gap-3 text-base">
                        <span className="w-2 h-2 rounded-full bg-[rgb(var(--primary))] flex-shrink-0" />
                        {t(`tshape.fdaItem${i}`)}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-6 text-sm text-muted leading-relaxed border-t border-theme pt-5">
                    {t("tshape.fdaNote")}
                  </p>
                </motion.div>
              </div>

              {/* Technologies — 3 cards */}
              <div className="mt-10 grid md:grid-cols-3 gap-8">
                {[1, 2, 3].map((i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: i * 0.1 }}
                    whileHover={{ y: -5, boxShadow: "0 20px 50px rgba(0,0,0,0.18)" }}
                    className="bg-surface border border-theme rounded-2xl shadow-soft p-8"
                  >
                    <div className="w-12 h-12 rounded-full bg-[rgb(var(--primary)/0.1)] flex items-center justify-center mb-5">
                      <div className="w-5 h-5 rounded-full bg-[rgb(var(--primary)/0.4)]" />
                    </div>
                    <h4 className="font-display text-base tracking-wide">{t(`tshape.tech${i}Title`)}</h4>
                    <p className="mt-3 text-sm text-muted leading-relaxed">{t(`tshape.tech${i}Desc`)}</p>
                  </motion.div>
                ))}
              </div>
            </section>
          </div>
        </AnimatedSection>

        {/* PLANS — wave dentro de la sección para que la abrace */}
        <AnimatedSection>
          <div className="section-elevated">
            <WaveDivider variant="accent" flip className="wave-divider--inside-section" />
            <section id="planes" className="max-w-7xl mx-auto px-6 py-20 md:py-28">
              <SectionTitle title={t("plans.title")} subtitle={t("plans.subtitle")} />
              <div className="mt-10 grid md:grid-cols-3 gap-8 items-center">
                <Plan name={t("plans.plan1")} items={[t("plans.plan1Item1"), t("plans.plan1Item2"), t("plans.plan1Item3")]} delay={0} />
                <Plan featured name={t("plans.plan2")} items={[t("plans.plan2Item1"), t("plans.plan2Item2"), t("plans.plan2Item3")]} delay={0.1} />
                <Plan name={t("plans.plan3")} items={[t("plans.plan3Item1"), t("plans.plan3Item2"), t("plans.plan3Item3")]} delay={0.2} />
              </div>
            </section>
          </div>
        </AnimatedSection>

        {/* ─── SECCIÓN DE CITAS (emulada) ─── */}
        <div className="section-elevated">
          <WaveDivider variant="subtle" flip className="wave-divider--inside-section" />
          <BookingSection />
        </div>

        {/* ─── CTA BANNER ─── wave dentro de la sección para que la abrace */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[rgb(var(--primary)/0.08)] via-[rgb(var(--bg))] to-[rgb(var(--primary)/0.05)] pointer-events-none" />
          <WaveDivider variant="primary" flip className="wave-divider--inside-section relative z-10" />
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
      </main>

      {/* ─── FOOTER (wave dentro para que abrace) ─── */}
      <div>
        <WaveDivider variant="primary" flip className="wave-divider--inside-section" />
        <Footer />
      </div>
    </>
  );
}

export default function Page() {
  return (
    <ThemeProvider>
      <PageContent />
    </ThemeProvider>
  );
}

/* ═══════════════════════════════════════════
   Sub-components
   ═══════════════════════════════════════════ */

function Stat({ label, value, delay = 0 }: { label: string; value: string; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -4, boxShadow: "0 10px 30px rgba(0,0,0,0.12)" }}
      className="bg-surface border border-theme rounded-2xl p-6 md:p-8 cursor-default text-center"
    >
      <div className="text-sm text-muted">{label}</div>
      <div className="text-2xl md:text-3xl font-display font-bold mt-2" style={{ color: "rgb(var(--primary))" }}>{value}</div>
    </motion.div>
  );
}

function Card({ title, children, delay = 0 }: { title: string; children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay }}
      whileHover={{ y: -6, boxShadow: "0 20px 50px rgba(0,0,0,0.18)" }}
      className="bg-surface border border-theme rounded-2xl shadow-soft p-8 md:p-10"
    >
      <div className="font-display text-lg md:text-xl tracking-wide">{title}</div>
      <p className="mt-3 text-base text-muted leading-relaxed">{children}</p>
    </motion.div>
  );
}

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

function Service({ name, desc, delay = 0 }: { name: string; desc: string; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -4, boxShadow: "0 15px 40px rgba(0,0,0,0.15)" }}
      className="bg-surface border border-theme rounded-2xl shadow-soft p-8"
    >
      <div className="font-display text-lg font-semibold">{name}</div>
      <p className="text-base text-muted mt-3 leading-relaxed">{desc}</p>
    </motion.div>
  );
}

function Plan({ name, items, featured, delay = 0 }: { name: string; items: string[]; featured?: boolean; delay?: number }) {
  const t = useTranslations();
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay }}
      whileHover={{
        y: -8,
        boxShadow: featured
          ? "0 25px 60px rgba(var(--primary), 0.15)"
          : "0 20px 50px rgba(0,0,0,0.18)",
      }}
      className={`bg-surface border rounded-2xl shadow-soft p-8 md:p-10 ${
        featured ? "border-[rgb(var(--primary)/0.4)] ring-1 ring-[rgb(var(--primary)/0.2)] scale-[1.03]" : "border-theme"
      }`}
    >
      <div className="font-display text-xl tracking-wide">{name}</div>
      <ul className="mt-4 space-y-3 text-base text-muted">
        {items.map((x) => (
          <li key={x} className="flex items-start gap-2">
            <span className="mt-1.5 w-2 h-2 rounded-full bg-[rgb(var(--primary)/0.4)] flex-shrink-0" />
            {x}
          </li>
        ))}
      </ul>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`mt-6 w-full rounded-xl px-5 py-4 text-base font-semibold ${
          featured ? "btn-primary shadow-lg" : "btn-outline"
        }`}
      >
        {t("plans.chooseBtn")}
      </motion.button>
    </motion.div>
  );
}
