"use client";

import ThemeProvider from "@/components/theme/ThemeProvider";
import ThemeSwitcher from "@/components/theme/ThemeSwitcher";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LoadingScreen from "@/components/LoadingScreen";
import AnimatedSection from "@/components/AnimatedSection";
import CustomCursor from "@/components/CustomCursor";
import ScrollProgress from "@/components/ScrollProgress";
import WaveDivider from "@/components/WaveDivider";
import BookingSection from "@/components/BookingSection";
import GiantScrollCard from "@/components/GiantScrollCard";
import { motion } from "framer-motion";
import { useState } from "react";
import TypewriterText from "@/components/TypewriterText";
import { useTranslations } from "next-intl";
import { useScrollDirection } from "@/lib/useScrollDirection";
import { LATERAL } from "@/lib/lateralAnimation";

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
  const scrollDirection = useScrollDirection();
  const fromY = scrollDirection === "down" ? LATERAL.fromY : -LATERAL.fromY;

  return (
    <>
      <CustomCursor />
      <ScrollProgress />
      <LoadingScreen />
      <ThemeSwitcher />
      <Header />

      {/* ─── HERO ─── */}
      <section id="inicio" className="scroll-snap-section relative flex flex-col min-h-[calc(100vh-5rem)] overflow-hidden">
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
                  initial={{ opacity: 0, scale: LATERAL.scaleBranch }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: LATERAL.durationFlower, delay: 0.3, ease: LATERAL.ease }}
                  className="relative w-64 h-64 md:w-80 md:h-80 lg:w-96 lg:h-96 rounded-full border border-[rgb(var(--primary)/0.25)] overflow-hidden flex items-center justify-center bg-[rgb(var(--surface)/0.3)] backdrop-blur-sm"
                >
                  {/* Inner ring */}
                  <div className="absolute inset-2 rounded-full border border-[rgb(var(--primary)/0.12)]" />

                  <img
                    src="/logos/Black-Gradient-Logo-02.png"
                    alt="Thrive Formative"
                    className="w-3/4 h-3/4 object-contain relative z-10 logo-glow"
                  />
                </motion.div>
              </div>
            </div>
          </AnimatedSection>

          {/* RIGHT — Text content */}
          <div>
            <motion.h1
              className="font-display text-4xl sm:text-5xl md:text-6xl leading-tight tracking-wide italic"
              initial={{ opacity: 0, y: LATERAL.fromY }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: LATERAL.durationFlower, delay: 0.2, ease: LATERAL.ease }}
            >
              {t("hero.title")}
            </motion.h1>

            <motion.p
              className="mt-5 text-muted text-xl leading-relaxed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: LATERAL.durationFlower, delay: 0.4, ease: LATERAL.ease }}
            >
              {t("hero.subtitle")}
            </motion.p>

            {/* Benefits grid — 2×2 like reference */}
            <motion.div
              className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5"
              initial={{ opacity: 0, y: LATERAL.fromY }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: LATERAL.durationFlower, delay: 0.55, ease: LATERAL.ease }}
            >
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="benefit-dot relative mt-1.5 w-4 h-4 rounded-full bg-[rgb(var(--primary)/0.2)] flex items-center justify-center flex-shrink-0">
                    <div className="w-1.5 h-1.5 rounded-full bg-[rgb(var(--primary))]" />
                  </div>
                  <span className="text-lg leading-snug">{t(`hero.benefit${i}`)}</span>
                </div>
              ))}
            </motion.div>

            {/* CTA button */}
            <motion.div
              className="mt-9"
              initial={{ opacity: 0, y: LATERAL.fromY }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: LATERAL.durationFlower, delay: 0.7, ease: LATERAL.ease }}
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
      <AnimatedSection className="scroll-snap-section">
        <div className="max-w-7xl mx-auto px-6 py-16 min-h-[50vh] flex flex-col justify-center">
          <div className="grid grid-cols-3 gap-6">
            <Stat label={t("hero.stat1Label")} value={t("hero.stat1Value")} delay={0} fromY={fromY} />
            <Stat label={t("hero.stat2Label")} value={t("hero.stat2Value")} delay={0.1} fromY={fromY} />
            <Stat label={t("hero.stat3Label")} value={t("hero.stat3Value")} delay={0.2} fromY={fromY} />
          </div>
        </div>
      </AnimatedSection>

      {/* ─── FLOW CARD ─── */}
      <AnimatedSection delay={0.1} className="scroll-snap-section">
        <div className="max-w-7xl mx-auto px-6 pb-14 min-h-[50vh] flex flex-col justify-center">
          <motion.div
            whileHover={{ y: -4, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}
            transition={{ duration: 0.3 }}
            className="bg-surface border border-theme rounded-2xl shadow-soft p-8"
          >
            <div className="text-base text-muted tracking-[0.22em]">{t("flow.title")}</div>
            <ul className="mt-4 space-y-3 text-lg leading-relaxed">
              <li>{t("flow.newPatient")}</li>
              <li>{t("flow.followUp")}</li>
              <li>{t("flow.policies")}</li>
            </ul>
            <div className="mt-6 p-5 rounded-xl border border-theme bg-[rgb(var(--bg)/0.6)]">
              <div className="text-base text-muted">{t("flow.script")}</div>
              <p className="text-lg mt-2">&ldquo;{t("flow.scriptText")}&rdquo;</p>
            </div>
          </motion.div>
        </div>
      </AnimatedSection>

      {/* ─── MAIN CONTENT — Tarjetas con animación al entrar ─── */}
      <main className="scroll-cards-stack">
        <GiantScrollCard variant="slideUp" id="approach" noFade>
          <div className="fullscreen-content fullscreen-content--expanded">
            <FullscreenCard titleA={t("approach.title1a")} titleB={t("approach.title1b")} large>{t("approach.desc1")}</FullscreenCard>
          </div>
        </GiantScrollCard>
        <GiantScrollCard variant="slideUp" id="approach-2" noFade>
          <div className="fullscreen-content fullscreen-content--expanded">
            <FullscreenCard titleA={t("approach.title2a")} titleB={t("approach.title2b")} large>{t("approach.desc2")}</FullscreenCard>
          </div>
        </GiantScrollCard>
        <GiantScrollCard variant="slideUp" id="approach-3" noFade>
          <div className="fullscreen-content fullscreen-content--expanded">
            <FullscreenCard titleA={t("approach.title3")} large>{t("approach.desc3")}</FullscreenCard>
          </div>
        </GiantScrollCard>
        <GiantScrollCard variant="slideUp" id="servicios">
          <div className="max-w-7xl mx-auto px-6 py-16 md:py-24">
            <SectionTitle title={t("services.title")} subtitle={t("services.subtitle")} fromY={fromY} />
            <div className="mt-12 grid md:grid-cols-2 gap-8 md:gap-10">
              <Service name={t("services.service1")} desc={t("services.desc1")} delay={0} />
              <Service name={t("services.service2")} desc={t("services.desc2")} delay={0.1} />
              <Service name={t("services.service3")} desc={t("services.desc3")} delay={0.2} />
              <Service name={t("services.service4")} desc={t("services.desc4")} delay={0.3} />
              <Service name={t("services.service5")} desc={t("services.desc5")} delay={0.4} />
              <Service name={t("services.service6")} desc={t("services.desc6")} delay={0.5} />
            </div>
          </div>
        </GiantScrollCard>
        <GiantScrollCard variant="slideUp" id="tshape">
          <section className="max-w-7xl mx-auto px-6 py-20 md:py-28">
            <SectionTitle title={t("tshape.title")} subtitle={t("tshape.subtitle")} fromY={fromY} />

            <div className="mt-10 grid md:grid-cols-[1fr_1.4fr] gap-10 items-start">
                {/* Left — Machine image + FDA badge overlay */}
                <motion.div
                  initial={{ opacity: 0, x: -LATERAL.fromY }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: false, amount: 0.02 }}
                  transition={{ duration: LATERAL.durationBranch, ease: LATERAL.ease }}
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
                    initial={{ opacity: 0, scale: LATERAL.scaleFlower, rotate: -15 }}
                    whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
                    viewport={{ once: false, amount: 0.02 }}
                    transition={{ duration: LATERAL.durationFlower, delay: 0.25, ease: LATERAL.ease }}
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
                  initial={{ opacity: 0, x: LATERAL.fromY }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: false, amount: 0.02 }}
                  transition={{ duration: LATERAL.durationBranch, delay: 0.1, ease: LATERAL.ease }}
                  className="bg-surface border border-theme rounded-2xl shadow-soft p-6"
                >
                  <p className="text-lg leading-relaxed">{t("tshape.fdaDesc")}</p>
                  <ul className="mt-5 space-y-3">
                    {[1, 2, 3, 4].map((i) => (
                      <li key={i} className="flex items-center gap-3 text-lg">
                        <span className="w-2 h-2 rounded-full bg-[rgb(var(--primary))] flex-shrink-0" />
                        {t(`tshape.fdaItem${i}`)}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-6 text-base text-muted leading-relaxed border-t border-theme pt-5">
                    {t("tshape.fdaNote")}
                  </p>
                </motion.div>
              </div>

              {/* Technologies — 3 cards */}
              <div className="mt-10 grid md:grid-cols-3 gap-8">
                {[1, 2, 3].map((i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: fromY }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: false, amount: 0.02 }}
                    transition={{ duration: LATERAL.durationBranch, delay: i * LATERAL.staggerBase, ease: LATERAL.ease }}
                    whileHover={{ y: -5, boxShadow: "0 20px 50px rgba(0,0,0,0.18)" }}
                    className="bg-surface border border-theme rounded-2xl shadow-soft p-8"
                  >
                    <div className="w-12 h-12 rounded-full bg-[rgb(var(--primary)/0.1)] flex items-center justify-center mb-5">
                      <div className="w-5 h-5 rounded-full bg-[rgb(var(--primary)/0.4)]" />
                    </div>
                    <h4 className="font-display text-lg tracking-wide">{t(`tshape.tech${i}Title`)}</h4>
                    <p className="mt-3 text-base text-muted leading-relaxed">{t(`tshape.tech${i}Desc`)}</p>
                  </motion.div>
                ))}
              </div>
            </section>
        </GiantScrollCard>
        <GiantScrollCard variant="slideUp" id="planes">
          <section className="max-w-7xl mx-auto px-6 py-20 md:py-28">
            <SectionTitle title={t("plans.title")} subtitle={t("plans.subtitle")} fromY={fromY} />
            <div className="mt-10 grid md:grid-cols-3 gap-8 items-center">
              <Plan name={t("plans.plan1")} items={[t("plans.plan1Item1"), t("plans.plan1Item2"), t("plans.plan1Item3")]} delay={0} fromY={fromY} />
              <Plan featured name={t("plans.plan2")} items={[t("plans.plan2Item1"), t("plans.plan2Item2"), t("plans.plan2Item3")]} delay={0.1} fromY={fromY} />
              <Plan name={t("plans.plan3")} items={[t("plans.plan3Item1"), t("plans.plan3Item2"), t("plans.plan3Item3")]} delay={0.2} fromY={fromY} />
            </div>
          </section>
        </GiantScrollCard>
        <GiantScrollCard variant="slideUp" id="citas">
          <BookingSection />
        </GiantScrollCard>
        <GiantScrollCard variant="slideUp" id="cta" noFade>
          <div className="absolute inset-0 bg-gradient-to-br from-[rgb(var(--primary)/0.08)] via-transparent to-[rgb(var(--primary)/0.05)] pointer-events-none" />
          <div className="relative z-10 max-w-4xl mx-auto px-6 py-24 md:py-32 text-center">
            <CTASection
              title={t("cta.title")}
              subtitle={t("cta.subtitle")}
              buttonText={t("cta.button")}
            />
          </div>
        </GiantScrollCard>
      </main>

      {/* ─── FOOTER (wave dentro para que abrace) ─── */}
      <div className="scroll-snap-section">
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

function CTASection({ title, subtitle, buttonText }: { title: string; subtitle: string; buttonText: string }) {
  const [titleDone, setTitleDone] = useState(false);

  return (
    <>
      <TypewriterText
        text={title}
        speed={50}
        as="h2"
        className="font-display text-4xl md:text-5xl lg:text-6xl tracking-wide block"
        onComplete={() => setTitleDone(true)}
      />
      <TypewriterText
        text={subtitle}
        speed={28}
        delay={200}
        active={titleDone}
        as="p"
        className="mt-5 text-xl md:text-2xl text-muted leading-relaxed max-w-2xl mx-auto block"
      />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.5 }}
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
          {buttonText}
        </motion.a>
      </motion.div>
    </>
  );
}

function FullscreenCard({ title, titleA, titleB, children, large }: { title?: string; titleA?: string; titleB?: string; children: React.ReactNode; large?: boolean }) {
  const [titleDone, setTitleDone] = useState(false);

  if (large && titleA != null) {
    const titleText = titleB ? `${titleA} ${titleB}` : titleA;
    const descText = typeof children === "string" ? children : String(children);

    return (
      <div className="py-10 md:py-14 px-2 md:px-6">
        <TypewriterText
          text={titleText}
          speed={55}
          as="h2"
          className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl tracking-wide leading-tight"
          onComplete={() => setTitleDone(true)}
        />
        <TypewriterText
          text={descText}
          speed={28}
          delay={200}
          active={titleDone}
          as="p"
          className="mt-8 md:mt-12 text-xl md:text-2xl lg:text-3xl xl:text-4xl text-muted leading-loose max-w-none tracking-wide"
        />
      </div>
    );
  }

  return (
    <div className="py-8 md:py-12">
      <h2 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl tracking-wide leading-tight">
        {title ?? `${titleA ?? ""} ${titleB ?? ""}`.trim()}
      </h2>
      <p className="mt-6 md:mt-8 text-lg md:text-xl lg:text-2xl text-muted leading-relaxed max-w-3xl">
        {children}
      </p>
    </div>
  );
}

function Stat({ label, value, delay = 0, fromY = LATERAL.fromY }: { label: string; value: string; delay?: number; fromY?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: fromY }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: false, amount: 0.02 }}
      transition={{ duration: LATERAL.durationBranch, delay, ease: LATERAL.ease }}
      whileHover={{ y: -4, boxShadow: "0 10px 30px rgba(0,0,0,0.12)" }}
      className="bg-surface border border-theme rounded-2xl p-6 md:p-8 cursor-default text-center"
    >
      <div className="text-base text-muted">{label}</div>
      <div className="text-3xl md:text-4xl font-display font-bold mt-2" style={{ color: "rgb(var(--primary))" }}>{value}</div>
    </motion.div>
  );
}


function SectionTitle({ title, subtitle, fromY = LATERAL.fromY }: { title: string; subtitle: string; fromY?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: fromY }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: false, amount: 0.02 }}
      transition={{ duration: LATERAL.durationBranch, ease: LATERAL.ease }}
      className="mb-4"
    >
      <h2 className="font-display text-4xl md:text-5xl lg:text-6xl tracking-wide">{title}</h2>
      <p className="text-lg md:text-xl text-muted mt-3 max-w-2xl leading-relaxed">{subtitle}</p>
    </motion.div>
  );
}

function Service({ name, desc, delay = 0 }: { name: string; desc: string; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: LATERAL.scaleBranch }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: false, amount: 0.02 }}
      transition={{ duration: LATERAL.durationBranch, delay, ease: LATERAL.ease }}
      whileHover={{ y: -6, boxShadow: "0 20px 50px rgba(0,0,0,0.18)" }}
      className="bg-surface border border-theme rounded-2xl shadow-soft p-8 md:p-10"
    >
      <div className="font-display text-2xl md:text-3xl font-semibold">{name}</div>
      <p className="text-lg md:text-xl text-muted mt-4 leading-relaxed">{desc}</p>
    </motion.div>
  );
}

function Plan({ name, items, featured, delay = 0, fromY = LATERAL.fromY }: { name: string; items: string[]; featured?: boolean; delay?: number; fromY?: number }) {
  const t = useTranslations();
  return (
    <motion.div
      initial={{ opacity: 0, y: fromY }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: false, amount: 0.02 }}
      transition={{ duration: LATERAL.durationBranch, delay, ease: LATERAL.ease }}
      whileHover={{
        y: -8,
        boxShadow: featured
          ? "0 25px 60px rgba(var(--primary), 0.15)"
          : "0 20px 50px rgba(0,0,0,0.18)",
      }}
      className={`bg-surface border rounded-2xl shadow-soft p-8 md:p-10 lg:p-12 ${
        featured ? "border-[rgb(var(--primary)/0.4)] ring-1 ring-[rgb(var(--primary)/0.2)] scale-[1.03]" : "border-theme"
      }`}
    >
      <div className="font-display text-3xl md:text-4xl tracking-wide">{name}</div>
      <ul className="mt-4 space-y-3 text-lg text-muted">
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
        className={`mt-6 w-full rounded-xl px-5 py-4 text-lg font-semibold ${
          featured ? "btn-primary shadow-lg" : "btn-outline"
        }`}
      >
        {t("plans.chooseBtn")}
      </motion.button>
    </motion.div>
  );
}
