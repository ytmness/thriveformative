"use client";

import { useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import Header from "@/components/Header";
import HomePageSections from "@/components/home/HomePageSections";
import type { HomePageEditableConfig } from "@/components/home/homePageTypes";
import NewsSection from "@/components/NewsSection";
import { CmsProvider } from "@/components/cms/CmsProvider";
import type { CmsAdminApi } from "@/hooks/useCmsAdmin";
import { buildFallbackArticles } from "@/lib/cms/mergePreviewLists";
import {
  nextSortOrderFromDisplay,
  resolveArticlesForDisplay,
  resolvePlansForDisplay,
  resolveServicesForDisplay,
} from "@/lib/cms/resolveDisplay";
import {
  fallbackPlansFromTranslations,
  fallbackServicesFromTranslations,
} from "@/lib/cms/fallbackContent";
import CmsEditDrawer, { type CmsEditTarget } from "@/components/admin/cms/CmsEditDrawer";
import {
  CmsPreviewDoctorSection,
  CmsPreviewFaqSection,
} from "@/components/admin/cms/CmsPreviewInfoSections";
import { getNestedMessage } from "@/lib/i18n/getMessage";
import type { Locale } from "@/lib/cms/types";
import esMessages from "@/messages/es.json";
import enMessages from "@/messages/en.json";
import koMessages from "@/messages/ko.json";
import itMessages from "@/messages/it.json";
import "@/app/styles/utilities.css";
import "@/app/styles/cms-preview-info.css";
import "@/app/styles/hero-stats.css";
import "@/app/styles/booking.css";
import "@/app/styles/header-nav.css";
import "@/app/styles/admin-cms-visual.css";
import "@/components/news-section.css";

type Props = {
  cms: CmsAdminApi;
  siteLocale: string;
};

const ARTICLE_KEYS = ["a1", "a2", "a3", "a4", "a5"] as const;

const MESSAGES_BY_LOCALE: Record<Locale, Record<string, unknown>> = {
  es: esMessages as Record<string, unknown>,
  en: enMessages as Record<string, unknown>,
  ko: koMessages as Record<string, unknown>,
  it: itMessages as Record<string, unknown>,
};

export default function CmsVisualPreview({ cms, siteLocale }: Props) {
  const t = useTranslations();
  const tServices = useTranslations("services");
  const tPlans = useTranslations("plans");
  const tNews = useTranslations("news");
  const [editTarget, setEditTarget] = useState<CmsEditTarget | null>(null);
  const [previewArticleId, setPreviewArticleId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const {
    locale,
    services,
    plans,
    articles,
    textDraft,
    addService,
    addPlan,
    addArticle,
    toggleServiceVisibility,
    togglePlanVisibility,
    toggleArticleVisibility,
    deleteService,
    deletePlan,
    deleteArticle,
  } = cms;

  const txt = (key: string, fallbackKey: string = key) => {
    const v = textDraft[key];
    if (v?.trim()) return v;
    const fromCmsLocale = getNestedMessage(MESSAGES_BY_LOCALE[locale], fallbackKey);
    if (fromCmsLocale) return fromCmsLocale;
    try {
      return t(fallbackKey as never);
    } catch {
      return "";
    }
  };

  const txtLocale = (key: string) => txt(key, key);

  const fallbackArticles = useMemo(
    () =>
      buildFallbackArticles(
        locale,
        ARTICLE_KEYS.map((key) => ({
          category: tNews(`items.${key}.category`),
          title: tNews(`items.${key}.title`),
        }))
      ),
    [locale, tNews]
  );

  const previewServices = useMemo(
    () =>
      resolveServicesForDisplay(
        services,
        fallbackServicesFromTranslations(tServices),
        { includeUnpublished: true }
      ),
    [services, tServices]
  );

  const previewPlans = useMemo(
    () =>
      resolvePlansForDisplay(plans, fallbackPlansFromTranslations(tPlans), {
        includeUnpublished: true,
      }),
    [plans, tPlans]
  );

  const previewArticles = useMemo(
    () =>
      resolveArticlesForDisplay(articles, fallbackArticles, { includeUnpublished: true }),
    [articles, fallbackArticles]
  );

  const previewBundle = useMemo(
    () => ({
      services,
      plans,
      articles: previewArticles,
      textOverrides: textDraft,
    }),
    [services, plans, previewArticles, textDraft]
  );

  function openService(id: string, fallback?: { name: string; description: string }) {
    if (id.startsWith("fallback-service-")) {
      const sort_order = Number.parseInt(id.replace("fallback-service-", ""), 10);
      setEditTarget({
        kind: "service",
        id: addService({ ...fallback, sort_order }),
      });
      return;
    }
    setEditTarget({ kind: "service", id });
  }

  function openPlan(
    id: string,
    fallback?: { name: string; items: string[]; is_featured: boolean }
  ) {
    if (id.startsWith("fallback-plan-")) {
      const sort_order = Number.parseInt(id.replace("fallback-plan-", ""), 10);
      setEditTarget({
        kind: "plan",
        id: addPlan({ ...fallback, sort_order }),
      });
      return;
    }
    setEditTarget({ kind: "plan", id });
  }

  function openArticle(id: string) {
    if (id.startsWith("fallback-article-")) {
      const index = Number.parseInt(id.replace("fallback-article-", ""), 10);
      const fb = fallbackArticles[index];
      if (fb) {
        setEditTarget({
          kind: "article",
          id: addArticle({
            category: fb.category,
            title: fb.title,
            sort_order: fb.sort_order,
          }),
        });
      }
      return;
    }
    setEditTarget({ kind: "article", id });
  }

  const editable: HomePageEditableConfig = {
    txt,
    onEdit: setEditTarget,
    services: previewServices,
    plans: previewPlans,
    onAddService: () => addService({ sort_order: nextSortOrderFromDisplay(previewServices) }),
    onAddPlan: () => addPlan({ sort_order: nextSortOrderFromDisplay(previewPlans) }),
    onEditService: openService,
    onEditPlan: openPlan,
    onToggleServiceVisibility: toggleServiceVisibility,
    onTogglePlanVisibility: togglePlanVisibility,
    onDeleteService: deleteService,
    onDeletePlan: deletePlan,
  };

  return (
    <div className="admin-cms-visual">
      <p className="admin-cms-visual__hint">
        Vista idéntica a la página pública. Haz clic en un bloque para editarlo; usa{" "}
        <strong>Ocultar</strong> para dejar de mostrarlo sin borrarlo. Al añadir servicios, planes o
        artículos nuevos, el resto sigue visible al instante.
      </p>

      <div className="admin-cms-visual__frame">
        <div className="admin-cms-visual__scroll" ref={scrollRef}>
          <CmsProvider
            value={{
              ...previewBundle,
              loading: false,
              error: null,
            }}
          >
            <div className="admin-cms-visual__page">
              <Header
                preview={{
                  scrollRef,
                  pathname: `/${siteLocale}`,
                }}
              />
              <HomePageSections
                editable={editable}
                previewAfterServices={
                  <CmsPreviewDoctorSection txt={txtLocale} onEdit={setEditTarget} />
                }
                previewBeforeCta={
                  <CmsPreviewFaqSection txt={txtLocale} onEdit={setEditTarget} />
                }
              />

              <section className="admin-cms-visual__news-block" aria-label="Noticias">
                <NewsSection
                  articleId={previewArticleId}
                  onArticleIdChange={setPreviewArticleId}
                  adminEditable={{
                    onEditArticle: openArticle,
                    onAddArticle: () =>
                      addArticle({ sort_order: nextSortOrderFromDisplay(previewArticles) }),
                    onToggleArticleVisibility: toggleArticleVisibility,
                    onDeleteArticle: deleteArticle,
                    onEditHeader: () =>
                      setEditTarget({
                        kind: "texts",
                        title: "Noticias — encabezado",
                        keys: [
                          { key: "news.label", label: "Etiqueta" },
                          { key: "news.titlePrefix", label: "Título (prefijo)" },
                          { key: "news.titleWord", label: "Título (palabra destacada)" },
                          { key: "news.searchPlaceholder", label: "Placeholder búsqueda" },
                        ],
                      }),
                  }}
                />
                <div className="admin-cms-visual__add-row">
                  <button
                    type="button"
                    className="admin-cms-visual__add-btn"
                    onClick={() =>
                      addArticle({ sort_order: nextSortOrderFromDisplay(previewArticles) })
                    }
                  >
                    + Añadir artículo
                  </button>
                </div>
              </section>
            </div>
          </CmsProvider>
        </div>
      </div>

      <p className="text-sm text-muted">
        <a
          href={`/${siteLocale}`}
          target="_blank"
          rel="noreferrer"
          className="underline hover:text-[rgb(var(--primary))]"
        >
          Abrir inicio
        </a>
        {" · "}
        <a
          href={`/${siteLocale}/noticias`}
          target="_blank"
          rel="noreferrer"
          className="underline hover:text-[rgb(var(--primary))]"
        >
          Ver noticias
        </a>
        {" · idioma del CMS: "}
        <strong>{locale}</strong>
        {locale !== siteLocale ? (
          <span className="text-amber-600">
            {" "}
            (la URL del admin es /{siteLocale}/admin — elige el mismo idioma arriba)
          </span>
        ) : null}
      </p>

      <CmsEditDrawer target={editTarget} onClose={() => setEditTarget(null)} cms={cms} />
    </div>
  );
}
