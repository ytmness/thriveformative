"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { resolveCmsText } from "@/lib/cms/fetch";
import {
  fallbackPlansFromTranslations,
  fallbackServicesFromTranslations,
} from "@/lib/cms/fallbackContent";
import type { CmsAdminApi } from "@/hooks/useCmsAdmin";
import type { CmsArticle } from "@/lib/cms/types";
import CmsEditableZone from "@/components/admin/cms/CmsEditableZone";
import CmsEditDrawer, { type CmsEditTarget } from "@/components/admin/cms/CmsEditDrawer";
import "@/app/styles/utilities.css";
import "@/app/styles/admin-cms-visual.css";

type PreviewService = { id: string; name: string; desc: string; unpublished?: boolean };
type PreviewPlan = {
  id: string;
  name: string;
  items: string[];
  featured: boolean;
  unpublished?: boolean;
};

type Props = {
  cms: CmsAdminApi;
  siteLocale: string;
};

export default function CmsVisualPreview({ cms, siteLocale }: Props) {
  const t = useTranslations();
  const tServices = useTranslations("services");
  const tPlans = useTranslations("plans");
  const tNews = useTranslations("news");
  const [editTarget, setEditTarget] = useState<CmsEditTarget | null>(null);

  const {
    locale,
    services,
    plans,
    articles,
    textDraft,
    addService,
    addPlan,
    addArticle,
  } = cms;

  const txt = (key: string, fallbackKey: string) =>
    resolveCmsText(textDraft, key, t(fallbackKey as never));

  const previewServices: PreviewService[] = useMemo(() => {
    if (services.length > 0) {
      return services.map((s) => ({
        id: s.id,
        name: s.name || "Sin nombre",
        desc: s.description || "…",
        unpublished: !s.is_published,
      }));
    }
    return fallbackServicesFromTranslations(tServices).map((s, i) => ({
      id: `fallback-service-${i}`,
      name: s.name,
      desc: s.description,
    }));
  }, [services, tServices]);

  const previewPlans: PreviewPlan[] = useMemo(() => {
    if (plans.length > 0) {
      return plans.map((p) => ({
        id: p.id,
        name: p.name || "Sin nombre",
        items: p.items.length ? p.items : ["…"],
        featured: p.is_featured,
        unpublished: !p.is_published,
      }));
    }
    return fallbackPlansFromTranslations(tPlans).map((p, i) => ({
      id: `fallback-plan-${i}`,
      name: p.name,
      items: p.items,
      featured: p.is_featured,
    }));
  }, [plans, tPlans]);

  const previewArticles = useMemo(() => {
    if (articles.length > 0) return articles;
    return (["a1", "a2", "a3", "a4", "a5"] as const).map((key, i) => ({
      id: `fallback-article-${i}`,
      locale,
      sort_order: i,
      category: tNews(`items.${key}.category`),
      title: tNews(`items.${key}.title`),
      body: null,
      image_url: null,
      is_published: true,
      published_at: new Date().toISOString().slice(0, 10),
    })) as CmsArticle[];
  }, [articles, locale, tNews]);

  function openTexts(
    title: string,
    keys: { key: string; label: string }[],
    subtitle?: string
  ) {
    setEditTarget({ kind: "texts", title, subtitle, keys });
  }

  function openService(id: string, fallback?: { name: string; description: string }) {
    if (id.startsWith("fallback-service-")) {
      const newId = addService(fallback);
      setEditTarget({ kind: "service", id: newId });
      return;
    }
    setEditTarget({ kind: "service", id });
  }

  function openPlan(
    id: string,
    fallback?: { name: string; items: string[]; is_featured: boolean }
  ) {
    if (id.startsWith("fallback-plan-")) {
      const newId = addPlan(fallback);
      setEditTarget({ kind: "plan", id: newId });
      return;
    }
    setEditTarget({ kind: "plan", id });
  }

  function openArticle(id: string) {
    if (id.startsWith("fallback-article-")) {
      const newId = addArticle();
      setEditTarget({ kind: "article", id: newId });
      return;
    }
    setEditTarget({ kind: "article", id });
  }

  return (
    <div className="admin-cms-visual">
      <p className="admin-cms-visual__hint">
        Haz clic en cualquier bloque resaltado para editarlo. La vista replica el diseño de la página
        de inicio.
      </p>

      <div className="admin-cms-visual__frame">
        <div className="admin-cms-visual__scroll">
          <div className="admin-cms-visual__page">
            {/* Hero */}
            <section className="relative px-6 py-10 md:py-14 bg-gradient-to-br from-[rgb(var(--bg))] to-[rgb(var(--primary)/0.04)]">
              <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-8 items-center">
                <div className="hidden md:flex justify-center opacity-80 pointer-events-none">
                  <div className="w-48 h-48 rounded-full border border-[rgb(var(--primary)/0.25)] flex items-center justify-center bg-[rgb(var(--surface)/0.3)]">
                    <img
                      src="/logos/Black-Gradient-Logo-02.png"
                      alt=""
                      className="w-3/4 h-3/4 object-contain"
                    />
                  </div>
                </div>
                <div className="hero-editorial">
                  <CmsEditableZone
                    label="Título del hero"
                    onEdit={() =>
                      openTexts("Hero — título", [{ key: "hero.title", label: "Título principal" }])
                    }
                  >
                    <h1 className="hero-editorial__title">{txt("hero.title", "hero.title")}</h1>
                  </CmsEditableZone>

                  <CmsEditableZone
                    label="Subtítulo del hero"
                    onEdit={() =>
                      openTexts("Hero — subtítulo", [
                        { key: "hero.subtitle", label: "Subtítulo" },
                      ])
                    }
                  >
                    <p className="hero-editorial__lead">{txt("hero.subtitle", "hero.subtitle")}</p>
                  </CmsEditableZone>

                  <CmsEditableZone
                    label="Beneficios del hero"
                    onEdit={() =>
                      openTexts("Hero — beneficios", [
                        { key: "hero.benefit1", label: "Beneficio 1" },
                        { key: "hero.benefit2", label: "Beneficio 2" },
                        { key: "hero.benefit3", label: "Beneficio 3" },
                        { key: "hero.benefit4", label: "Beneficio 4" },
                      ])
                    }
                  >
                    <ul className="hero-editorial__benefits">
                      {[1, 2, 3, 4].map((i) => (
                        <li key={i} className="hero-editorial__benefit">
                          <span className="hero-editorial__bullet" aria-hidden />
                          <span className="hero-editorial__benefit-text">
                            {txt(`hero.benefit${i}`, `hero.benefit${i}`)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </CmsEditableZone>

                  <CmsEditableZone
                    label="Botón del hero"
                    onEdit={() =>
                      openTexts("Hero — botón", [
                        { key: "hero.scheduleBtn", label: "Texto del botón" },
                      ])
                    }
                  >
                    <div className="hero-editorial__cta">
                      <span className="plan-card-plan__btn plan-card-plan__btn--featured hero-editorial__cta-btn">
                        {txt("hero.scheduleBtn", "hero.scheduleBtn")}
                      </span>
                    </div>
                  </CmsEditableZone>
                </div>
              </div>
            </section>

            {/* Enfoque */}
            <section className="px-6 py-12 max-w-7xl mx-auto">
              <CmsEditableZone
                label="Sección enfoque"
                onEdit={() =>
                  openTexts("Enfoque — encabezado", [
                    { key: "approach.sectionEyebrow", label: "Etiqueta" },
                    { key: "approach.sectionTitle", label: "Título" },
                    { key: "approach.sectionLead", label: "Texto introductorio" },
                  ])
                }
              >
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
              </CmsEditableZone>
              <p className="text-xs text-muted mt-3 px-1">
                Los tres pilares del enfoque siguen en los archivos de traducción (no editables aquí).
              </p>
            </section>

            {/* Servicios */}
            <section className="services-editorial-section px-6">
              <CmsEditableZone
                label="Encabezado de servicios"
                onEdit={() =>
                  openTexts("Servicios — encabezado", [
                    { key: "services.title", label: "Título" },
                    { key: "services.subtitle", label: "Subtítulo" },
                  ])
                }
              >
                <header className="services-editorial-section__head">
                  <h2 className="services-editorial-section__title">
                    {txt("services.title", "services.title")}
                  </h2>
                  <p className="services-editorial-section__subtitle">
                    {txt("services.subtitle", "services.subtitle")}
                  </p>
                </header>
              </CmsEditableZone>

              <div className="services-editorial-section__grid mt-6">
                {previewServices.map((s) => (
                  <CmsEditableZone
                    key={s.id}
                    label={`Servicio: ${s.name}`}
                    unpublished={s.unpublished}
                    onEdit={() =>
                      openService(s.id, {
                        name: s.name,
                        description: s.desc,
                      })
                    }
                  >
                    <article className="service-editorial-card">
                      <h3 className="service-editorial-card__title">{s.name}</h3>
                      <p className="service-editorial-card__desc">{s.desc}</p>
                    </article>
                  </CmsEditableZone>
                ))}
              </div>
              <div className="admin-cms-visual__add-row">
                <button
                  type="button"
                  className="admin-cms-visual__add-btn"
                  onClick={() => {
                    const id = addService();
                    setEditTarget({ kind: "service", id });
                  }}
                >
                  + Añadir servicio
                </button>
              </div>
            </section>

            {/* Planes */}
            <section className="plans-section px-6">
              <CmsEditableZone
                label="Encabezado de planes"
                onEdit={() =>
                  openTexts("Planes — encabezado", [
                    { key: "plans.title", label: "Título" },
                    { key: "plans.subtitle", label: "Subtítulo" },
                    { key: "plans.recommendedBadge", label: "Badge recomendado" },
                    { key: "plans.chooseBtn", label: "Texto del botón" },
                  ])
                }
              >
                <div className="plans-section__intro">
                  <h2 className="plans-section__title">{txt("plans.title", "plans.title")}</h2>
                  <p className="plans-section__subtitle">
                    {txt("plans.subtitle", "plans.subtitle")}
                  </p>
                </div>
              </CmsEditableZone>

              <div className="plans-section__grid">
                {previewPlans.map((plan) => (
                  <CmsEditableZone
                    key={plan.id}
                    label={`Plan: ${plan.name}`}
                    unpublished={plan.unpublished}
                    onEdit={() =>
                      openPlan(plan.id, {
                        name: plan.name,
                        items: plan.items,
                        is_featured: plan.featured,
                      })
                    }
                  >
                    <div
                      className={`plan-card-plan ${plan.featured ? "plan-card-plan--featured" : "plan-card-plan--side"}`}
                    >
                      {plan.featured ? (
                        <span className="plan-card-plan__badge">
                          {txt("plans.recommendedBadge", "plans.recommendedBadge")}
                        </span>
                      ) : null}
                      <div className="plan-card-plan__inner">
                        <h3 className="plan-card-plan__title">{plan.name}</h3>
                        <ul className="plan-card-plan__list">
                          {plan.items.map((x) => (
                            <li key={x} className="plan-card-plan__item">
                              <span className="plan-card-plan__bullet" aria-hidden />
                              <span className="plan-card-plan__item-text">{x}</span>
                            </li>
                          ))}
                        </ul>
                        <span
                          className={`plan-card-plan__btn ${plan.featured ? "plan-card-plan__btn--featured" : "plan-card-plan__btn--outline"}`}
                        >
                          {txt("plans.chooseBtn", "plans.chooseBtn")}
                        </span>
                      </div>
                    </div>
                  </CmsEditableZone>
                ))}
              </div>
              <div className="admin-cms-visual__add-row">
                <button
                  type="button"
                  className="admin-cms-visual__add-btn"
                  onClick={() => {
                    const id = addPlan();
                    setEditTarget({ kind: "plan", id });
                  }}
                >
                  + Añadir plan
                </button>
              </div>
            </section>

            {/* CTA */}
            <section className="cta-final-section px-6">
              <div className="cta-final-shell">
                <CmsEditableZone
                  label="Llamada a la acción"
                  onEdit={() =>
                    openTexts("CTA final", [
                      { key: "cta.title", label: "Título" },
                      { key: "cta.subtitle", label: "Subtítulo" },
                      { key: "cta.button", label: "Botón" },
                    ])
                  }
                >
                  <h2 className="cta-final-title">{txt("cta.title", "cta.title")}</h2>
                  <p className="cta-final-sub">{txt("cta.subtitle", "cta.subtitle")}</p>
                  <div className="cta-final-actions">
                    <span className="cta-final-button">{txt("cta.button", "cta.button")}</span>
                  </div>
                </CmsEditableZone>
              </div>
            </section>

            {/* Noticias */}
            <div className="admin-cms-visual__news">
              <CmsEditableZone
                label="Encabezado de noticias"
                onEdit={() =>
                  openTexts("Noticias — encabezado", [
                    { key: "news.label", label: "Etiqueta" },
                    { key: "news.titlePrefix", label: "Título (prefijo)" },
                    { key: "news.titleWord", label: "Título (palabra destacada)" },
                    { key: "news.searchPlaceholder", label: "Placeholder búsqueda" },
                  ])
                }
              >
                <div>
                  <span className="text-xs uppercase tracking-[0.2em] text-muted">
                    {txt("news.label", "news.label")}
                  </span>
                  <h2 className="text-2xl md:text-3xl font-serif mt-2">
                    {txt("news.titlePrefix", "news.titlePrefix")}{" "}
                    <span className="text-[rgb(var(--primary))]">
                      {txt("news.titleWord", "news.titleWord")}
                    </span>
                  </h2>
                </div>
              </CmsEditableZone>

              <div className="admin-cms-visual__news-list">
                {previewArticles.map((a, i) => (
                  <CmsEditableZone
                    key={a.id}
                    label={`Noticia: ${a.title}`}
                    unpublished={articles.length > 0 && !a.is_published}
                    onEdit={() => openArticle(a.id)}
                  >
                    <div className="admin-cms-visual__news-item">
                      <span className="admin-cms-visual__news-num">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <div>
                        <div className="admin-cms-visual__news-cat">{a.category}</div>
                        <div className="admin-cms-visual__news-title">{a.title}</div>
                      </div>
                    </div>
                  </CmsEditableZone>
                ))}
              </div>
              <div className="admin-cms-visual__add-row">
                <button
                  type="button"
                  className="admin-cms-visual__add-btn"
                  onClick={() => {
                    const id = addArticle();
                    setEditTarget({ kind: "article", id });
                  }}
                >
                  + Añadir artículo
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <p className="text-sm text-muted">
        <a
          href={`/${siteLocale}`}
          target="_blank"
          rel="noreferrer"
          className="underline hover:text-[rgb(var(--primary))]"
        >
          Abrir sitio público en nueva pestaña
        </a>{" "}
        (idioma de la URL: {siteLocale}; contenido editado:{" "}
        {locale === "es"
          ? "Español"
          : locale === "en"
            ? "English"
            : locale === "ko"
              ? "한국어"
              : "Italiano"}
        )
      </p>

      <CmsEditDrawer target={editTarget} onClose={() => setEditTarget(null)} cms={cms} />
    </div>
  );
}
