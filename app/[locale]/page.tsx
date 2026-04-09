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
      <CustomCursor />
      <ScrollProgress />
      <LoadingScreen />
      <ThemeSwitcher />
      <Header />

      {/* ─── HERO ─── */}
      <section id="inicio" className="scroll-snap-section relative flex flex-col min-h-[calc(100vh-5rem)] md:h-[calc(100vh-5rem)] overflow-visible md:overflow-hidden">
        {/* Olas en capas absolutas — traspasan el contenido, sin hitbox */}
        <div className="absolute top-0 left-0 right-0 z-[5] pointer-events-none wave-hero-top">
          <WaveDivider variant="accent" className="wave-hero-top" flip />
        </div>
        <div className="absolute bottom-0 left-0 right-0 z-[5] pointer-events-none wave-hero-bottom">
          <WaveDivider variant="accent" className="wave-hero-bottom" />
        </div>
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 z-0 bg-gradient-to-br from-[rgb(var(--bg))] via-[rgb(var(--bg))] to-[rgb(var(--primary)/0.04)] pointer-events-none" />

        <div className="relative z-10 flex-1 min-h-0 max-w-7xl mx-auto px-6 py-4 md:py-6 grid md:grid-cols-2 gap-6 lg:gap-8 items-center w-full">
          {/* LEFT — Decorative circle with logo */}
          <AnimatedSection direction="left">
            <div className="flex justify-center">
              <div className="relative">
                {/* Organic pattern behind circle */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <OrganicPattern className="w-[200%] h-[200%] text-[rgb(var(--primary))]" />
                </div>

                {/* Glow behind circle */}
                <div className="hero-circle-glow absolute inset-0 rounded-full bg-[rgb(var(--primary)/0.12)] blur-3xl scale-110 pointer-events-none" />

                {/* Main circle */}
                <div className="relative w-56 h-56 sm:w-64 sm:h-64 md:w-80 md:h-80 lg:w-96 lg:h-96 rounded-full border border-[rgb(var(--primary)/0.25)] overflow-hidden flex items-center justify-center bg-[rgb(var(--surface)/0.3)] backdrop-blur-sm">
                  {/* Inner ring */}
                  <div className="absolute inset-2 rounded-full border border-[rgb(var(--primary)/0.12)]" />

                  <img
                    src="/logos/Black-Gradient-Logo-02.png"
                    alt="Thrive Formative"
                    className="w-3/4 h-3/4 object-contain relative z-10 logo-glow"
                  />
                </div>
              </div>
            </div>
          </AnimatedSection>

          {/* RIGHT — Text content */}
          <div>
            <h1 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl leading-tight tracking-wide">
              {t("hero.title")}
            </h1>

            <p className="mt-4 text-muted text-lg md:text-xl leading-relaxed">{t("hero.subtitle")}</p>

            {/* Benefits grid — 2×2 like reference */}
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-start gap-2">
                  <div className="benefit-dot relative mt-1 w-3.5 h-3.5 rounded-full bg-[rgb(var(--primary)/0.2)] flex items-center justify-center flex-shrink-0">
                    <div className="w-1 h-1 rounded-full bg-[rgb(var(--primary))]" />
                  </div>
                  <span className="text-base md:text-lg leading-snug">{t(`hero.benefit${i}`)}</span>
                </div>
              ))}
            </div>

            {/* CTA button */}
            <div className="mt-5 flex justify-center md:justify-start">
              <a
                href={WHATSAPP_LINK}
                target="_blank"
                rel="noreferrer"
                className="btn-cta inline-flex items-center justify-center text-center rounded-xl px-8 md:px-10 py-4 md:py-5 text-base md:text-lg tracking-wide shadow-lg leading-tight transition-transform hover:scale-[1.03] active:scale-[0.97]"
              >
                {t("hero.scheduleBtn")}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ─── STATS BAR ─── */}
      <AnimatedSection className="scroll-snap-section">
        <div className="max-w-7xl mx-auto px-6 py-16 min-h-[50vh] flex flex-col justify-center">
          <div className="grid grid-cols-3 gap-6">
            <Stat label={t("hero.stat1Label")} value={t("hero.stat1Value")} />
            <Stat label={t("hero.stat2Label")} value={t("hero.stat2Value")} />
            <Stat label={t("hero.stat3Label")} value={t("hero.stat3Value")} />
          </div>
        </div>
      </AnimatedSection>

      {/* ─── FLOW CARD ─── */}
      <AnimatedSection delay={0.1} className="scroll-snap-section">
        <div className="max-w-7xl mx-auto px-6 pb-14 min-h-[50vh] flex flex-col justify-center">
          <div className="bg-surface border border-theme rounded-2xl shadow-soft p-8 transition-shadow duration-300 hover:-translate-y-1 hover:shadow-[0_20px_60px_rgba(0,0,0,0.2)]">
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
          </div>
        </div>
      </AnimatedSection>

      {/* ─── MAIN CONTENT — bloques continuos ─── */}
      <main className="scroll-cards-stack">
        <GiantScrollCard variant="slideUp" id="approach" noFade compact>
          <div className="max-w-7xl mx-auto px-6 w-full">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 items-stretch">
              <ApproachPillar
                id="approach-funcional"
                title={`${t("approach.title1a")} ${t("approach.title1b")}`}
                highlight={t("approach.highlight1")}
                description={t("approach.desc1")}
              />
              <ApproachPillar
                id="approach-familiar"
                title={`${t("approach.title2a")} ${t("approach.title2b")}`}
                highlight={t("approach.highlight2")}
                description={t("approach.desc2")}
              />
              <ApproachPillar
                id="approach-acompanamiento"
                title={t("approach.title3")}
                highlight={t("approach.highlight3")}
                description={t("approach.desc3")}
              />
            </div>
          </div>
        </GiantScrollCard>
        <GiantScrollCard variant="slideUp" id="servicios">
          <div className="max-w-7xl mx-auto px-6 py-16 md:py-24">
            <SectionTitle title={t("services.title")} subtitle={t("services.subtitle")} />
            <div className="mt-12 grid md:grid-cols-2 gap-8 md:gap-10">
              <Service name={t("services.service1")} desc={t("services.desc1")} />
              <Service name={t("services.service2")} desc={t("services.desc2")} />
              <Service name={t("services.service3")} desc={t("services.desc3")} />
              <Service name={t("services.service4")} desc={t("services.desc4")} />
              <Service name={t("services.service5")} desc={t("services.desc5")} />
              <Service name={t("services.service6")} desc={t("services.desc6")} />
            </div>
          </div>
        </GiantScrollCard>
        <GiantScrollCard variant="slideUp" id="tshape">
          <section className="max-w-7xl mx-auto px-6 py-20 md:py-28">
            <SectionTitle title={t("tshape.title")} subtitle={t("tshape.subtitle")} />

            <div className="mt-10 grid md:grid-cols-[1fr_1.4fr] gap-10 items-start">
              {/* Left — Machine image + FDA badge overlay */}
              <div className="relative">
                <div className="bg-surface border border-theme rounded-2xl shadow-soft p-6 flex items-center justify-center transition-transform duration-300 hover:scale-[1.02]">
                  <img
                    src="/logos/t-shape-2-1.png"
                    alt="T-Shape 2"
                    className="w-full max-w-[280px] h-auto object-contain"
                  />
                </div>
                {/* FDA seal — positioned as stamp on top-right */}
                <div className="absolute -top-8 -right-8 w-32 h-32 md:w-40 md:h-40">
                  <img
                    src="/logos/fda-approved.png"
                    alt={t("tshape.fdaBadge")}
                    className="w-full h-full object-contain drop-shadow-lg"
                    style={{ filter: "invert(1) sepia(0.3) saturate(2.5) hue-rotate(345deg) brightness(0.82)" }}
                  />
                </div>
              </div>

              {/* Right — FDA info + indications */}
              <div className="bg-surface border border-theme rounded-2xl shadow-soft p-6">
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
              </div>
            </div>

            {/* Technologies — 3 cards */}
            <div className="mt-10 grid md:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-surface border border-theme rounded-2xl shadow-soft p-8 transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(0,0,0,0.18)]"
                >
                  <div className="w-12 h-12 rounded-full bg-[rgb(var(--primary)/0.1)] flex items-center justify-center mb-5">
                    <div className="w-5 h-5 rounded-full bg-[rgb(var(--primary)/0.4)]" />
                  </div>
                  <h4 className="font-display text-lg tracking-wide">{t(`tshape.tech${i}Title`)}</h4>
                  <p className="mt-3 text-base text-muted leading-relaxed">{t(`tshape.tech${i}Desc`)}</p>
                </div>
              ))}
            </div>
          </section>
        </GiantScrollCard>
        <GiantScrollCard variant="slideUp" id="planes">
          <section className="max-w-7xl mx-auto px-6 py-20 md:py-28">
            <SectionTitle title={t("plans.title")} subtitle={t("plans.subtitle")} />
            <div className="mt-10 grid md:grid-cols-3 gap-8 items-center">
              <Plan
                name={t("plans.plan1")}
                items={[t("plans.plan1Item1"), t("plans.plan1Item2"), t("plans.plan1Item3")]}
              />
              <Plan
                featured
                name={t("plans.plan2")}
                items={[t("plans.plan2Item1"), t("plans.plan2Item2"), t("plans.plan2Item3")]}
              />
              <Plan
                name={t("plans.plan3")}
                items={[t("plans.plan3Item1"), t("plans.plan3Item2"), t("plans.plan3Item3")]}
              />
            </div>
          </section>
        </GiantScrollCard>
        <GiantScrollCard variant="slideUp" id="citas">
          <BookingSection />
        </GiantScrollCard>
        <GiantScrollCard variant="slideUp" id="cta" noFade>
          <div className="max-w-4xl mx-auto px-6 py-24 md:py-32 text-center">
            <CTASection title={t("cta.title")} subtitle={t("cta.subtitle")} buttonText={t("cta.button")} />
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
  return (
    <>
      <h2 className="font-display text-4xl md:text-5xl lg:text-6xl tracking-wide block text-center mx-auto max-w-4xl">
        {title}
      </h2>
      <p className="mt-5 text-xl md:text-2xl text-muted leading-relaxed block text-center mx-auto max-w-3xl">
        {subtitle}
      </p>
      <div className="mt-10">
        <a
          href={WHATSAPP_LINK}
          target="_blank"
          rel="noreferrer"
          className="btn-cta inline-block rounded-xl px-12 py-5 text-lg tracking-wide shadow-xl transition-transform hover:scale-[1.04] active:scale-[0.97]"
        >
          {buttonText}
        </a>
      </div>
    </>
  );
}

/** Tres pilares en fila, mismo ritmo visual que las stats del hero. */
function ApproachPillar({
  id,
  title,
  highlight,
  description,
}: {
  id: string;
  title: string;
  highlight: string;
  description: string;
}) {
  return (
    <article
      id={id}
      className="bg-surface border border-theme rounded-2xl p-5 md:p-6 flex flex-col h-full text-center transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(0,0,0,0.12)]"
    >
      <h3 className="text-sm md:text-base text-muted tracking-wide">{title}</h3>
      <p className="mt-2 text-xl sm:text-2xl md:text-3xl font-display font-semibold text-[rgb(var(--primary))] leading-tight text-balance">
        {highlight}
      </p>
      <p className="mt-4 text-sm text-muted leading-relaxed text-left md:text-center grow">{description}</p>
    </article>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface border border-theme rounded-2xl p-6 md:p-8 cursor-default text-center transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(0,0,0,0.12)]">
      <div className="text-base text-muted">{label}</div>
      <div className="text-3xl md:text-4xl font-display font-bold mt-2 text-[rgb(var(--primary))]">{value}</div>
    </div>
  );
}

function SectionTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-4">
      <h2 className="font-display text-4xl md:text-5xl lg:text-6xl tracking-wide">{title}</h2>
      <p className="text-lg md:text-xl text-muted mt-3 max-w-2xl leading-relaxed">{subtitle}</p>
    </div>
  );
}

function Service({ name, desc }: { name: string; desc: string }) {
  return (
    <div className="bg-surface border border-theme rounded-2xl shadow-soft p-8 md:p-10 transition-[transform,box-shadow] duration-300 hover:-translate-y-1.5 hover:shadow-[0_20px_50px_rgba(0,0,0,0.18)]">
      <div className="font-display text-2xl md:text-3xl font-semibold">{name}</div>
      <p className="text-lg md:text-xl text-muted mt-4 leading-relaxed">{desc}</p>
    </div>
  );
}

function Plan({
  name,
  items,
  featured,
}: {
  name: string;
  items: string[];
  featured?: boolean;
}) {
  const t = useTranslations();
  return (
    <div
      className={`bg-surface border rounded-2xl shadow-soft p-8 md:p-10 lg:p-12 transition-[transform,box-shadow] duration-300 hover:-translate-y-2 ${
        featured
          ? "border-[rgb(var(--primary)/0.4)] ring-1 ring-[rgb(var(--primary)/0.2)] scale-[1.03] hover:shadow-[0_25px_60px_rgba(var(--primary),0.15)]"
          : "border-theme hover:shadow-[0_20px_50px_rgba(0,0,0,0.18)]"
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
      <button
        type="button"
        className={`mt-6 w-full rounded-xl px-5 py-4 text-lg font-semibold transition-transform hover:scale-[1.05] active:scale-[0.95] ${
          featured ? "btn-primary shadow-lg" : "btn-outline"
        }`}
      >
        {t("plans.chooseBtn")}
      </button>
    </div>
  );
}
