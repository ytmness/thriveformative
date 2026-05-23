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
import { WHATSAPP_LINK } from "@/lib/branding";
import { CmsProvider, useCmsContext } from "@/components/cms/CmsProvider";
import CmsText from "@/components/cms/CmsText";
import { resolveCmsText } from "@/lib/cms/fetch";
import {
  fallbackPlansFromTranslations,
  fallbackServicesFromTranslations,
} from "@/lib/cms/fallbackContent";

/* ───────────────────────────────────────────
   Decorative SVG – organic line-art pattern
   behind the hero circle (mandala-esque)
   ─────────────────────────────────────────── */
function TShapeCheckIcon() {
  return (
    <span className="tshape-hero__check" aria-hidden>
      <svg className="tshape-hero__check-svg" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="10" cy="10" r="8.5" stroke="currentColor" strokeWidth="1.1" opacity="0.9" />
        <path
          d="M6 10.2 8.6 12.8 14.2 7.2"
          stroke="currentColor"
          strokeWidth="1.35"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

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
  const tServices = useTranslations("services");
  const tPlans = useTranslations("plans");
  const { services: cmsServices, plans: cmsPlans, textOverrides } = useCmsContext();

  const displayServices =
    cmsServices.length > 0
      ? cmsServices.map((s) => ({ name: s.name, desc: s.description }))
      : fallbackServicesFromTranslations(tServices).map((s) => ({
          name: s.name,
          desc: s.description,
        }));

  const displayPlans =
    cmsPlans.length > 0
      ? cmsPlans.map((p) => ({
          name: p.name,
          items: p.items,
          featured: p.is_featured,
        }))
      : fallbackPlansFromTranslations(tPlans).map((p) => ({
          name: p.name,
          items: p.items,
          featured: p.is_featured,
        }));

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
          <div className="hero-editorial">
            <h1 className="hero-editorial__title">
              <CmsText contentKey="hero.title" as="span" />
            </h1>

            <p className="hero-editorial__lead">
              <CmsText contentKey="hero.subtitle" as="span" />
            </p>

            <ul className="hero-editorial__benefits">
              {[1, 2, 3, 4].map((i) => (
                <li key={i} className="hero-editorial__benefit">
                  <span className="hero-editorial__bullet" aria-hidden />
                  <span className="hero-editorial__benefit-text">
                    <CmsText contentKey={`hero.benefit${i}`} as="span" />
                  </span>
                </li>
              ))}
            </ul>

            <div className="hero-editorial__cta">
              <a
                href={WHATSAPP_LINK}
                target="_blank"
                rel="noreferrer"
                className="plan-card-plan__btn plan-card-plan__btn--featured hero-editorial__cta-btn"
              >
                <CmsText contentKey="hero.scheduleBtn" as="span" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ─── STATS BAR ─── */}
      <AnimatedSection className="scroll-snap-section">
        <div className="max-w-7xl mx-auto px-6 py-12 md:py-16 md:min-h-[50vh] flex flex-col justify-center">
          <HeroStats />
        </div>
      </AnimatedSection>

      {/* ─── MAIN CONTENT — bloques continuos ─── */}
      <main className="scroll-cards-stack">
        <GiantScrollCard variant="slideUp" id="approach" noFade compact>
          <div className="approach-editorial">
            <header className="approach-editorial__header">
              <div className="approach-editorial__header-copy">
                <p className="approach-editorial__eyebrow">{t("approach.sectionEyebrow")}</p>
                <h2 className="approach-editorial__title">{t("approach.sectionTitle")}</h2>
              </div>
              <p className="approach-editorial__lead">{t("approach.sectionLead")}</p>
            </header>
            <div className="approach-editorial__rule" aria-hidden />
            <div className="approach-editorial__columns">
              <ApproachPillar
                id="approach-funcional"
                title={`${t("approach.title1a")} ${t("approach.title1b")}`}
                description={t("approach.desc1")}
              />
              <ApproachPillar
                id="approach-familiar"
                title={`${t("approach.title2a")} ${t("approach.title2b")}`}
                description={t("approach.desc2")}
              />
              <ApproachPillar
                id="approach-acompanamiento"
                title={t("approach.title3")}
                description={t("approach.desc3")}
              />
            </div>
          </div>
        </GiantScrollCard>
        <GiantScrollCard variant="slideUp" id="servicios">
          <section className="services-editorial-section">
            <header className="services-editorial-section__head">
              <h2 className="services-editorial-section__title">
                <CmsText contentKey="services.title" as="span" />
              </h2>
              <p className="services-editorial-section__subtitle">
                <CmsText contentKey="services.subtitle" as="span" />
              </p>
            </header>
            <div className="services-editorial-section__grid">
              {displayServices.map((s) => (
                <Service key={s.name} name={s.name} desc={s.desc} />
              ))}
            </div>
          </section>
        </GiantScrollCard>
        <GiantScrollCard variant="slideUp" id="tshape">
          <section className="tshape-section">
            <div className="tshape-section__contain">
              <div className="tshape-hero">
                <div className="tshape-hero__copy">
                  <p className="tshape-hero__eyebrow">{t("tshape.eyebrow")}</p>
                  <h2 className="tshape-hero__title">{t("tshape.heroTitle")}</h2>
                  <p className="tshape-hero__lead">{t("tshape.subtitle")}</p>
                  <p className="tshape-hero__fda-intro">{t("tshape.fdaDesc")}</p>
                  <ul className="tshape-hero__list">
                    {[1, 2, 3, 4].map((i) => (
                      <li key={i} className="tshape-hero__item">
                        <TShapeCheckIcon />
                        <span className="tshape-hero__item-text">{t(`tshape.fdaItem${i}`)}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="tshape-hero__note">{t("tshape.fdaNote")}</p>
                </div>
                <div className="tshape-hero__visual">
                  <div className="tshape-hero__frame">
                    <img
                      src="/logos/t-shape-2-1.png"
                      alt={t("tshape.title")}
                      className="tshape-hero__img"
                    />
                  </div>
                  <div className="tshape-hero__fda-badge">
                    <img
                      src="/logos/fda-approved.png"
                      alt={t("tshape.fdaBadge")}
                      className="tshape-hero__fda-img"
                    />
                  </div>
                </div>
              </div>

              <div className="tshape-tech">
                {[1, 2, 3].map((i) => (
                  <article key={i} className="tshape-tech-card">
                    <div className="tshape-tech-card__icon" aria-hidden>
                      <span className="tshape-tech-card__dot" />
                    </div>
                    <h3 className="tshape-tech-card__title">{t(`tshape.tech${i}Title`)}</h3>
                    <p className="tshape-tech-card__desc">{t(`tshape.tech${i}Desc`)}</p>
                  </article>
                ))}
              </div>
            </div>
          </section>
        </GiantScrollCard>
        <GiantScrollCard variant="slideUp" id="planes">
          <section className="plans-section">
            <div className="plans-section__intro">
              <h2 className="plans-section__title">
                <CmsText contentKey="plans.title" as="span" />
              </h2>
              <p className="plans-section__subtitle">
                <CmsText contentKey="plans.subtitle" as="span" />
              </p>
            </div>
            <div className="plans-section__grid">
              {displayPlans.map((plan) => (
                <Plan
                  key={plan.name}
                  featured={plan.featured}
                  name={plan.name}
                  items={plan.items}
                />
              ))}
            </div>
          </section>
        </GiantScrollCard>
        <GiantScrollCard variant="slideUp" id="citas">
          <BookingSection />
        </GiantScrollCard>
        <GiantScrollCard variant="slideUp" id="cta" noFade>
          <section className="cta-final-section">
            <div className="cta-final-shell">
              <CTASection
                title={resolveCmsText(textOverrides, "cta.title", t("cta.title"))}
                subtitle={resolveCmsText(textOverrides, "cta.subtitle", t("cta.subtitle"))}
                buttonText={resolveCmsText(textOverrides, "cta.button", t("cta.button"))}
              />
            </div>
          </section>
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
      <CmsProvider>
        <PageContent />
      </CmsProvider>
    </ThemeProvider>
  );
}

/* ═══════════════════════════════════════════
   Sub-components
   ═══════════════════════════════════════════ */

function CTASection({ title, subtitle, buttonText }: { title: string; subtitle: string; buttonText: string }) {
  return (
    <>
      <h2 className="cta-final-title">{title}</h2>
      <p className="cta-final-sub">{subtitle}</p>
      <div className="cta-final-actions">
        <a
          href={WHATSAPP_LINK}
          target="_blank"
          rel="noreferrer"
          className="cta-final-button"
        >
          {buttonText}
        </a>
      </div>
    </>
  );
}

/** Tres pilares — layout editorial (rejilla + serif). */
function ApproachPillar({
  id,
  title,
  description,
}: {
  id: string;
  title: string;
  description: string;
}) {
  return (
    <article id={id} className="approach-editorial__column">
      <h3 className="approach-editorial__column-title">{title}</h3>
      <p className="approach-editorial__column-desc">{description}</p>
    </article>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface border border-theme rounded-2xl p-6 md:p-8 cursor-default text-center transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(0,0,0,0.12)]">
      <div className="type-stat-label">{label}</div>
      <div className="type-stat-value mt-2">{value}</div>
    </div>
  );
}

/** Móvil: una tarjeta con filas (tiempo arriba, nombre debajo). Desktop: tres tarjetas. */
function HeroStats() {
  const t = useTranslations();
  const rows = [
    { label: t("hero.stat1Label"), value: t("hero.stat1Value") },
    { label: t("hero.stat2Label"), value: t("hero.stat2Value") },
    { label: t("hero.stat3Label"), value: t("hero.stat3Value") },
  ];
  return (
    <>
      <div className="hero-stats-mobile md:hidden w-full max-w-md mx-auto" role="list">
        {rows.map((row) => (
          <div key={row.label} className="hero-stats-mobile__row" role="listitem">
            <div className="hero-stats-mobile__value">{row.value}</div>
            <div className="hero-stats-mobile__label">{row.label}</div>
          </div>
        ))}
      </div>
      <div className="hidden md:grid md:grid-cols-3 gap-6 w-full">
        {rows.map((row) => (
          <Stat key={row.label} label={row.label} value={row.value} />
        ))}
      </div>
    </>
  );
}

function Service({ name, desc }: { name: string; desc: string }) {
  return (
    <article className="service-editorial-card">
      <h3 className="service-editorial-card__title">{name}</h3>
      <p className="service-editorial-card__desc">{desc}</p>
    </article>
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
  return (
    <div
      className={`plan-card-plan ${featured ? "plan-card-plan--featured" : "plan-card-plan--side"}`}
    >
      {featured ? (
        <span className="plan-card-plan__badge">
          <CmsText contentKey="plans.recommendedBadge" as="span" />
        </span>
      ) : null}
      <div className="plan-card-plan__inner">
        <h3 className="plan-card-plan__title">{name}</h3>
        <ul className="plan-card-plan__list">
          {items.map((x) => (
            <li key={x} className="plan-card-plan__item">
              <span className="plan-card-plan__bullet" aria-hidden />
              <span className="plan-card-plan__item-text">{x}</span>
            </li>
          ))}
        </ul>
        <button
          type="button"
          className={`plan-card-plan__btn ${featured ? "plan-card-plan__btn--featured" : "plan-card-plan__btn--outline"}`}
        >
          <CmsText contentKey="plans.chooseBtn" as="span" />
        </button>
      </div>
    </div>
  );
}
