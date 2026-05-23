"use client";

import AnimatedSection from "@/components/AnimatedSection";
import BookingSection from "@/components/BookingSection";
import GiantScrollCard from "@/components/GiantScrollCard";
import WaveDivider from "@/components/WaveDivider";
import CmsEditableZone from "@/components/admin/cms/CmsEditableZone";
import CmsText from "@/components/cms/CmsText";
import { useCmsContext } from "@/components/cms/CmsProvider";
import type { HomePageEditableConfig } from "@/components/home/homePageTypes";
import BrandCtaLink from "@/components/ui/BrandCtaLink";
import { WHATSAPP_LINK } from "@/lib/branding";
import { resolveCmsText } from "@/lib/cms/fetch";
import {
  fallbackPlansFromTranslations,
  fallbackServicesFromTranslations,
} from "@/lib/cms/fallbackContent";
import {
  resolvePlansForDisplay,
  resolveServicesForDisplay,
} from "@/lib/cms/resolveDisplay";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

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
        <circle cx="250" cy="250" r="245" />
        <circle cx="250" cy="250" r="210" />
        <circle cx="250" cy="250" r="175" />
        <circle cx="250" cy="250" r="140" />
        <path d="M250,5 Q320,130 250,250 Q180,130 250,5" />
        <path d="M250,495 Q320,370 250,250 Q180,370 250,495" />
        <path d="M5,250 Q130,320 250,250 Q130,180 5,250" />
        <path d="M495,250 Q370,320 250,250 Q370,180 495,250" />
        <path d="M75,75 Q200,170 250,250 Q170,200 75,75" />
        <path d="M425,75 Q300,170 250,250 Q330,200 425,75" />
        <path d="M75,425 Q200,330 250,250 Q170,300 75,425" />
        <path d="M425,425 Q300,330 250,250 Q330,300 425,425" />
        <path d="M50,150 C150,100 200,200 250,250" />
        <path d="M450,150 C350,100 300,200 250,250" />
        <path d="M50,350 C150,400 200,300 250,250" />
        <path d="M450,350 C350,400 300,300 250,250" />
      </g>
    </svg>
  );
}

type Props = {
  editable?: HomePageEditableConfig;
  /** Solo vista previa CMS: bloque doctor tras servicios */
  previewAfterServices?: ReactNode;
  /** Solo vista previa CMS: bloque FAQ tras citas */
  previewBeforeCta?: ReactNode;
};

export default function HomePageSections({
  editable,
  previewAfterServices,
  previewBeforeCta,
}: Props) {
  const t = useTranslations();
  const tServices = useTranslations("services");
  const tPlans = useTranslations("plans");
  const { services: cmsServices, plans: cmsPlans, textOverrides } = useCmsContext();

  const line = (key: string) => resolveCmsText(textOverrides, key, t(key as never));

  const txt = (key: string, fallbackKey: string) =>
    editable ? editable.txt(key, fallbackKey) : line(key);

  const displayServices = editable
    ? editable.services.map((s) => ({
        id: s.id,
        name: s.name,
        desc: s.desc,
        unpublished: s.unpublished,
        isFallback: s.isFallback,
      }))
    : resolveServicesForDisplay(
        cmsServices,
        fallbackServicesFromTranslations(tServices),
        { includeUnpublished: false }
      ).map((s) => ({
        id: s.id,
        name: s.name,
        desc: s.desc,
        unpublished: s.unpublished,
        isFallback: s.isFallback,
      }));

  const displayPlans = editable
    ? editable.plans.map((p) => ({
        id: p.id,
        name: p.name,
        items: p.items,
        featured: p.featured,
        unpublished: p.unpublished,
        isFallback: p.isFallback,
      }))
    : resolvePlansForDisplay(cmsPlans, fallbackPlansFromTranslations(tPlans), {
        includeUnpublished: false,
      }).map((p) => ({
        id: p.id,
        name: p.name,
        items: p.items,
        featured: p.featured,
        unpublished: p.unpublished,
        isFallback: p.isFallback,
      }));

  const wrapText = (
    label: string,
    keys: { key: string; label: string }[],
    children: ReactNode,
    className?: string
  ) => {
    if (!editable) return children;
    return (
      <CmsEditableZone
        label={label}
        className={className}
        onEdit={() => editable.onEdit({ kind: "texts", title: label, keys })}
      >
        {children}
      </CmsEditableZone>
    );
  };

  const wrapEntity = (
    label: string,
    unpublished: boolean,
    onEdit: () => void,
    children: ReactNode,
    onToggleHide?: () => void,
    onDelete?: () => void
  ) => {
    if (!editable) return children;
    return (
      <CmsEditableZone
        label={label}
        unpublished={unpublished}
        onEdit={onEdit}
        onToggleHide={onToggleHide}
        onDelete={onDelete}
      >
        {children}
      </CmsEditableZone>
    );
  };

  return (
    <>
      <section
        id="inicio"
        className="scroll-snap-section relative flex flex-col min-h-[calc(100vh-5rem)] md:h-[calc(100vh-5rem)] overflow-visible md:overflow-hidden"
      >
        <div className="absolute top-0 left-0 right-0 z-[5] pointer-events-none wave-hero-top">
          <WaveDivider variant="accent" className="wave-hero-top" flip />
        </div>
        <div className="absolute bottom-0 left-0 right-0 z-[5] pointer-events-none wave-hero-bottom">
          <WaveDivider variant="accent" className="wave-hero-bottom" />
        </div>
        <div className="absolute inset-0 z-0 bg-gradient-to-br from-[rgb(var(--bg))] via-[rgb(var(--bg))] to-[rgb(var(--primary)/0.04)] pointer-events-none" />

        <div className="relative z-10 flex-1 min-h-0 max-w-7xl mx-auto px-6 py-4 md:py-6 grid md:grid-cols-2 gap-6 lg:gap-8 items-center w-full">
          <AnimatedSection direction="left">
            <div className="flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <OrganicPattern className="w-[200%] h-[200%] text-[rgb(var(--primary))]" />
                </div>
                <div className="hero-circle-glow absolute inset-0 rounded-full bg-[rgb(var(--primary)/0.12)] blur-3xl scale-110 pointer-events-none" />
                <div className="relative w-56 h-56 sm:w-64 sm:h-64 md:w-80 md:h-80 lg:w-96 lg:h-96 rounded-full border border-[rgb(var(--primary)/0.25)] overflow-hidden flex items-center justify-center bg-[rgb(var(--surface)/0.3)] backdrop-blur-sm">
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

          <div className="hero-editorial">
            {wrapText(
              "Título del hero",
              [{ key: "hero.title", label: "Título principal" }],
              <h1 className="hero-editorial__title">
                {editable ? txt("hero.title", "hero.title") : <CmsText contentKey="hero.title" as="span" />}
              </h1>
            )}
            {wrapText(
              "Subtítulo del hero",
              [{ key: "hero.subtitle", label: "Subtítulo" }],
              <p className="hero-editorial__lead">
                {editable ? (
                  txt("hero.subtitle", "hero.subtitle")
                ) : (
                  <CmsText contentKey="hero.subtitle" as="span" />
                )}
              </p>
            )}
            {wrapText(
              "Beneficios del hero",
              [
                { key: "hero.benefit1", label: "Beneficio 1" },
                { key: "hero.benefit2", label: "Beneficio 2" },
                { key: "hero.benefit3", label: "Beneficio 3" },
                { key: "hero.benefit4", label: "Beneficio 4" },
              ],
              <ul className="hero-editorial__benefits">
                {[1, 2, 3, 4].map((i) => (
                  <li key={i} className="hero-editorial__benefit">
                    <span className="hero-editorial__bullet" aria-hidden />
                    <span className="hero-editorial__benefit-text">
                      {editable ? (
                        txt(`hero.benefit${i}`, `hero.benefit${i}`)
                      ) : (
                        <CmsText contentKey={`hero.benefit${i}`} as="span" />
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            {wrapText(
              "Botón del hero",
              [{ key: "hero.scheduleBtn", label: "Texto del botón" }],
              <div className="hero-editorial__cta">
                <BrandCtaLink href={WHATSAPP_LINK} target="_blank" rel="noreferrer">
                  {editable ? (
                    txt("hero.scheduleBtn", "hero.scheduleBtn")
                  ) : (
                    <CmsText contentKey="hero.scheduleBtn" as="span" />
                  )}
                </BrandCtaLink>
              </div>
            )}
          </div>
        </div>
      </section>

      <AnimatedSection className="scroll-snap-section">
        <div className="max-w-7xl mx-auto px-6 py-12 md:py-16 md:min-h-[50vh] flex flex-col justify-center">
          {wrapText(
            "Estadísticas del hero",
            [
              { key: "heroStats.eyebrow", label: "Metodología — etiqueta" },
              { key: "heroStats.title", label: "Metodología — título" },
              { key: "hero.stat1Label", label: "Etiqueta estadística 1" },
              { key: "hero.stat1Value", label: "Valor estadística 1" },
              { key: "heroStats.stat1Desc", label: "Descripción estadística 1" },
              { key: "hero.stat2Label", label: "Etiqueta estadística 2" },
              { key: "hero.stat2Value", label: "Valor estadística 2" },
              { key: "heroStats.stat2Desc", label: "Descripción estadística 2" },
              { key: "hero.stat3Label", label: "Etiqueta estadística 3" },
              { key: "hero.stat3Value", label: "Valor estadística 3" },
              { key: "heroStats.stat3Desc", label: "Descripción estadística 3" },
            ],
            <HeroStats editable={editable} txt={txt} />
          )}
        </div>
      </AnimatedSection>

      <main className={editable ? "admin-cms-visual__main" : "scroll-cards-stack"}>
        <GiantScrollCard variant="slideUp" id="approach" noFade compact>
          <div className="approach-editorial">
            {wrapText(
              "Enfoque — encabezado",
              [
                { key: "approach.sectionEyebrow", label: "Etiqueta" },
                { key: "approach.sectionTitle", label: "Título" },
                { key: "approach.sectionLead", label: "Texto introductorio" },
              ],
              <header className="approach-editorial__header">
                <div className="approach-editorial__header-copy">
                  <p className="approach-editorial__eyebrow">
                    {txt("approach.sectionEyebrow", "approach.sectionEyebrow")}
                  </p>
                  <h2 className="approach-editorial__title">
                    {txt("approach.sectionTitle", "approach.sectionTitle")}
                  </h2>
                </div>
                <p className="approach-editorial__lead">
                  {txt("approach.sectionLead", "approach.sectionLead")}
                </p>
              </header>
            )}
            <div className="approach-editorial__rule" aria-hidden />
            <div className="approach-editorial__columns">
              {wrapText(
                "Pilar 1 — Medicina funcional",
                [
                  { key: "approach.title1a", label: "Título parte A" },
                  { key: "approach.title1b", label: "Título parte B" },
                  { key: "approach.desc1", label: "Descripción" },
                ],
                <ApproachPillar
                  id="approach-funcional"
                  title={`${txt("approach.title1a", "approach.title1a")} ${txt("approach.title1b", "approach.title1b")}`}
                  description={txt("approach.desc1", "approach.desc1")}
                />
              )}
              {wrapText(
                "Pilar 2 — Medicina familiar",
                [
                  { key: "approach.title2a", label: "Título parte A" },
                  { key: "approach.title2b", label: "Título parte B" },
                  { key: "approach.desc2", label: "Descripción" },
                ],
                <ApproachPillar
                  id="approach-familiar"
                  title={`${txt("approach.title2a", "approach.title2a")} ${txt("approach.title2b", "approach.title2b")}`}
                  description={txt("approach.desc2", "approach.desc2")}
                />
              )}
              {wrapText(
                "Pilar 3 — Acompañamiento",
                [
                  { key: "approach.title3", label: "Título" },
                  { key: "approach.desc3", label: "Descripción" },
                ],
                <ApproachPillar
                  id="approach-acompanamiento"
                  title={txt("approach.title3", "approach.title3")}
                  description={txt("approach.desc3", "approach.desc3")}
                />
              )}
            </div>
          </div>
        </GiantScrollCard>

        <GiantScrollCard variant="slideUp" id="servicios">
          <section className="services-editorial-section">
            {wrapText(
              "Servicios — encabezado",
              [
                { key: "services.title", label: "Título" },
                { key: "services.subtitle", label: "Subtítulo" },
              ],
              <header className="services-editorial-section__head">
                <h2 className="services-editorial-section__title">
                  {editable ? (
                    txt("services.title", "services.title")
                  ) : (
                    <CmsText contentKey="services.title" as="span" />
                  )}
                </h2>
                <p className="services-editorial-section__subtitle">
                  {editable ? (
                    txt("services.subtitle", "services.subtitle")
                  ) : (
                    <CmsText contentKey="services.subtitle" as="span" />
                  )}
                </p>
              </header>
            )}
            <div className="services-editorial-section__grid">
              {displayServices.map((s) =>
                wrapEntity(
                  `Servicio: ${s.name}`,
                  s.unpublished,
                  () =>
                    editable?.onEditService(s.id, {
                      name: s.name,
                      description: s.desc,
                    }),
                  <Service name={s.name} desc={s.desc} />,
                  !s.isFallback ? () => editable?.onToggleServiceVisibility(s.id) : undefined,
                  !s.isFallback ? () => editable?.onDeleteService(s.id) : undefined
                )
              )}
            </div>
            {editable ? (
              <div className="admin-cms-visual__add-row">
                <button type="button" className="admin-cms-visual__add-btn" onClick={editable.onAddService}>
                  + Añadir servicio
                </button>
              </div>
            ) : null}
          </section>
        </GiantScrollCard>

        {previewAfterServices}

        <GiantScrollCard variant="slideUp" id="tshape">
          <section className="tshape-section">
            <div className="tshape-section__contain">
              {wrapText(
                "T-Shape — bloque principal",
                [
                  { key: "tshape.eyebrow", label: "Etiqueta" },
                  { key: "tshape.heroTitle", label: "Título" },
                  { key: "tshape.subtitle", label: "Subtítulo" },
                  { key: "tshape.fdaDesc", label: "Intro FDA" },
                  { key: "tshape.fdaItem1", label: "FDA ítem 1" },
                  { key: "tshape.fdaItem2", label: "FDA ítem 2" },
                  { key: "tshape.fdaItem3", label: "FDA ítem 3" },
                  { key: "tshape.fdaItem4", label: "FDA ítem 4" },
                  { key: "tshape.fdaNote", label: "Nota FDA" },
                ],
                <div className="tshape-hero">
                  <div className="tshape-hero__copy">
                    <p className="tshape-hero__eyebrow">{txt("tshape.eyebrow", "tshape.eyebrow")}</p>
                    <h2 className="tshape-hero__title">{txt("tshape.heroTitle", "tshape.heroTitle")}</h2>
                    <p className="tshape-hero__lead">{txt("tshape.subtitle", "tshape.subtitle")}</p>
                    <p className="tshape-hero__fda-intro">{txt("tshape.fdaDesc", "tshape.fdaDesc")}</p>
                    <ul className="tshape-hero__list">
                      {[1, 2, 3, 4].map((i) => (
                        <li key={i} className="tshape-hero__item">
                          <TShapeCheckIcon />
                          <span className="tshape-hero__item-text">
                            {txt(`tshape.fdaItem${i}`, `tshape.fdaItem${i}`)}
                          </span>
                        </li>
                      ))}
                    </ul>
                    <p className="tshape-hero__note">{txt("tshape.fdaNote", "tshape.fdaNote")}</p>
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
              )}
              <div className="tshape-tech">
                {[1, 2, 3].map((i) =>
                  wrapText(
                    `T-Shape — tecnología ${i}`,
                    [
                      { key: `tshape.tech${i}Title`, label: "Título" },
                      { key: `tshape.tech${i}Desc`, label: "Descripción" },
                    ],
                    <article key={i} className="tshape-tech-card">
                      <div className="tshape-tech-card__icon" aria-hidden>
                        <span className="tshape-tech-card__dot" />
                      </div>
                      <h3 className="tshape-tech-card__title">
                        {txt(`tshape.tech${i}Title`, `tshape.tech${i}Title`)}
                      </h3>
                      <p className="tshape-tech-card__desc">
                        {txt(`tshape.tech${i}Desc`, `tshape.tech${i}Desc`)}
                      </p>
                    </article>
                  )
                )}
              </div>
            </div>
          </section>
        </GiantScrollCard>

        <GiantScrollCard variant="slideUp" id="planes">
          <section className="plans-section">
            {wrapText(
              "Planes — encabezado",
              [
                { key: "plans.title", label: "Título" },
                { key: "plans.subtitle", label: "Subtítulo" },
                { key: "plans.recommendedBadge", label: "Badge recomendado" },
                { key: "plans.chooseBtn", label: "Texto del botón" },
              ],
              <div className="plans-section__intro">
                <h2 className="plans-section__title">
                  {editable ? (
                    txt("plans.title", "plans.title")
                  ) : (
                    <CmsText contentKey="plans.title" as="span" />
                  )}
                </h2>
                <p className="plans-section__subtitle">
                  {editable ? (
                    txt("plans.subtitle", "plans.subtitle")
                  ) : (
                    <CmsText contentKey="plans.subtitle" as="span" />
                  )}
                </p>
              </div>
            )}
            <div className="plans-section__grid">
              {displayPlans.map((plan) =>
                wrapEntity(
                  `Plan: ${plan.name}`,
                  plan.unpublished,
                  () =>
                    editable?.onEditPlan(plan.id, {
                      name: plan.name,
                      items: plan.items,
                      is_featured: plan.featured,
                    }),
                  <Plan
                    name={plan.name}
                    items={plan.items}
                    featured={plan.featured}
                    editable={editable}
                    txt={txt}
                  />,
                  !plan.isFallback ? () => editable?.onTogglePlanVisibility(plan.id) : undefined,
                  !plan.isFallback ? () => editable?.onDeletePlan(plan.id) : undefined
                )
              )}
            </div>
            {editable ? (
              <div className="admin-cms-visual__add-row">
                <button type="button" className="admin-cms-visual__add-btn" onClick={editable.onAddPlan}>
                  + Añadir plan
                </button>
              </div>
            ) : null}
          </section>
        </GiantScrollCard>

        <GiantScrollCard variant="slideUp" id="citas">
          {editable ? (
            <CmsEditableZone
              label="Sección de citas (calendario)"
              onEdit={() =>
                editable.onEdit({
                  kind: "texts",
                  title: "Citas — textos",
                  subtitle: "Los horarios se configuran en Admin → Disponibilidad.",
                  keys: [
                    { key: "booking.title", label: "Título" },
                    { key: "booking.subtitle", label: "Subtítulo" },
                    { key: "booking.ctaHint", label: "Texto antes de WhatsApp" },
                    { key: "booking.ctaButton", label: "Botón WhatsApp" },
                  ],
                })
              }
            >
              <div className="admin-cms-visual__booking-wrap">
                <BookingSection />
              </div>
            </CmsEditableZone>
          ) : (
            <BookingSection />
          )}
        </GiantScrollCard>

        {previewBeforeCta}
      </main>
    </>
  );
}

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

function HeroStats({
  editable,
  txt,
}: {
  editable?: HomePageEditableConfig;
  txt: (key: string, fallbackKey: string) => string;
}) {
  const t = useTranslations();
  const tStats = useTranslations("heroStats");

  const eyebrow = editable ? txt("heroStats.eyebrow", "heroStats.eyebrow") : tStats("eyebrow");
  const sectionTitle = editable ? txt("heroStats.title", "heroStats.title") : tStats("title");

  const rows = [
    {
      label: editable ? txt("hero.stat1Label", "hero.stat1Label") : t("hero.stat1Label"),
      value: editable ? txt("hero.stat1Value", "hero.stat1Value") : t("hero.stat1Value"),
      desc: editable ? txt("heroStats.stat1Desc", "heroStats.stat1Desc") : tStats("stat1Desc"),
      num: "01",
    },
    {
      label: editable ? txt("hero.stat2Label", "hero.stat2Label") : t("hero.stat2Label"),
      value: editable ? txt("hero.stat2Value", "hero.stat2Value") : t("hero.stat2Value"),
      desc: editable ? txt("heroStats.stat2Desc", "heroStats.stat2Desc") : tStats("stat2Desc"),
      num: "02",
    },
    {
      label: editable ? txt("hero.stat3Label", "hero.stat3Label") : t("hero.stat3Label"),
      value: editable ? txt("hero.stat3Value", "hero.stat3Value") : t("hero.stat3Value"),
      desc: editable ? txt("heroStats.stat3Desc", "heroStats.stat3Desc") : tStats("stat3Desc"),
      num: "03",
    },
  ];

  return (
    <>
      <div className="hero-stats-mobile md:hidden w-full max-w-md mx-auto" role="list">
        {rows.map((row) => (
          <div key={row.num} className="hero-stats-mobile__row" role="listitem">
            <div className="hero-stats-mobile__value">{row.value}</div>
            <div className="hero-stats-mobile__label">{row.label}</div>
          </div>
        ))}
      </div>
      <div className="hero-stats-desktop hidden md:block w-full">
        <header className="hero-stats-desktop__header">
          <p className="hero-stats-desktop__eyebrow">{eyebrow}</p>
          <h2 className="hero-stats-desktop__title">{sectionTitle}</h2>
        </header>
        <div className="hero-stats-desktop__grid" role="list">
          {rows.map((row) => (
            <div key={row.num} className="hero-stats-desktop__card" role="listitem">
              <span className="hero-stats-desktop__num" aria-hidden>
                {row.num}
              </span>
              <div className="type-stat-value">{row.value}</div>
              <div className="type-stat-label">{row.label}</div>
              <p className="hero-stats-desktop__desc">{row.desc}</p>
            </div>
          ))}
        </div>
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
  editable,
  txt,
}: {
  name: string;
  items: string[];
  featured?: boolean;
  editable?: HomePageEditableConfig;
  txt: (key: string, fallbackKey: string) => string;
}) {
  return (
    <div
      className={`plan-card-plan ${featured ? "plan-card-plan--featured" : "plan-card-plan--side"}`}
    >
      {featured ? (
        <span className="plan-card-plan__badge">
          {editable ? (
            txt("plans.recommendedBadge", "plans.recommendedBadge")
          ) : (
            <CmsText contentKey="plans.recommendedBadge" as="span" />
          )}
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
          {editable ? (
            txt("plans.chooseBtn", "plans.chooseBtn")
          ) : (
            <CmsText contentKey="plans.chooseBtn" as="span" />
          )}
        </button>
      </div>
    </div>
  );
}
