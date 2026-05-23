"use client";

import { useMemo, useState } from "react";
import { useLocale } from "next-intl";
import { useTranslations } from "next-intl";
import CmsEditableZone from "@/components/admin/cms/CmsEditableZone";
import { useCmsContext } from "@/components/cms/CmsProvider";
import CmsText from "@/components/cms/CmsText";
import { resolveCmsText } from "@/lib/cms/fetch";
import { buildFallbackArticles } from "@/lib/cms/mergePreviewLists";
import { resolveArticlesForDisplay } from "@/lib/cms/resolveDisplay";
import type { Locale } from "@/lib/cms/types";
import "./news-section.css";

const ITEM_KEYS = ["a1", "a2", "a3", "a4", "a5"] as const;

const IMG_MAIN_DEFAULT =
  "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=900&q=80";
const IMG_SUB_DEFAULT =
  "https://images.unsplash.com/photo-1584308666744-24d5c474e2ae?auto=format&fit=crop&w=700&q=80";

export type NewsSectionAdminEditable = {
  onEditArticle: (id: string) => void;
  onAddArticle: () => void;
  onToggleArticleVisibility: (id: string) => void;
  onDeleteArticle: (id: string) => void;
  onEditHeader: () => void;
};

type Props = {
  adminEditable?: NewsSectionAdminEditable;
};

export default function NewsSection({ adminEditable }: Props) {
  const t = useTranslations("news");
  const pageLocale = useLocale() as Locale;
  const { articles: cmsArticles, textOverrides } = useCmsContext();
  const [query, setQuery] = useState("");

  const fallbackArticles = useMemo(
    () =>
      buildFallbackArticles(
        pageLocale,
        ITEM_KEYS.map((key) => ({
          category: t(`items.${key}.category`),
          title: t(`items.${key}.title`),
        }))
      ),
    [pageLocale, t]
  );

  const displayArticles = useMemo(
    () =>
      resolveArticlesForDisplay(cmsArticles, fallbackArticles, {
        includeUnpublished: !!adminEditable,
      }),
    [cmsArticles, fallbackArticles, adminEditable]
  );

  const rows = useMemo(() => {
    const base = displayArticles.map((a, i) => ({
      id: a.id,
      num: String(i + 1).padStart(2, "0"),
      category: a.category,
      title: a.title?.trim() || "(Sin título)",
      haystack: `${a.category} ${a.title}`.toLowerCase(),
      unpublished: !a.is_published,
      isFallback: a.id.startsWith("fallback-article-"),
    }));
    const q = query.trim().toLowerCase();
    if (!q) return base;
    return base.filter((r) => r.haystack.includes(q));
  }, [displayArticles, query]);

  const persistedArticles = cmsArticles.filter((a) => !a.id.startsWith("fallback-article-"));

  const imgMain =
    persistedArticles.find((a) => a.image_url && (adminEditable || a.is_published))?.image_url ??
    IMG_MAIN_DEFAULT;
  const imgSub =
    persistedArticles.filter((a) => a.image_url && (adminEditable || a.is_published))[1]
      ?.image_url ?? IMG_SUB_DEFAULT;

  const searchPlaceholder = resolveCmsText(
    textOverrides,
    "news.searchPlaceholder",
    t("searchPlaceholder")
  );

  const headerBlock = (
    <>
      <div className="shrink-0 flex items-center justify-between gap-4 px-5 py-4 md:px-8 md:py-4 border-b border-[var(--news-line)]">
        <span className="text-[0.65rem] md:text-xs uppercase tracking-[0.2em] text-[rgb(var(--muted))]">
          {adminEditable ? (
            resolveCmsText(textOverrides, "news.label", t("label"))
          ) : (
            <CmsText contentKey="news.label" as="span" />
          )}
        </span>
        <span className="text-[rgb(var(--muted))] opacity-60" aria-hidden>
          →
        </span>
      </div>

      <div className="shrink-0 px-5 py-3 md:px-8 md:py-4 border-b border-[var(--news-line)]">
        <label className="sr-only" htmlFor="news-search">
          {t("searchLabel")}
        </label>
        <div className="flex items-center gap-2 rounded-full border border-[var(--news-line)] bg-[rgb(var(--bg)/0.4)] px-4 py-2.5 max-w-md">
          <svg
            className="w-4 h-4 shrink-0 text-[rgb(var(--muted))]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
            aria-hidden
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z" />
          </svg>
          <span className="w-px h-4 bg-[var(--news-line)] shrink-0" aria-hidden />
          <input
            id="news-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={searchPlaceholder}
            className="flex-1 min-w-0 bg-transparent text-sm text-[rgb(var(--text))] placeholder:text-[rgb(var(--muted)/0.75)] outline-none"
            autoComplete="off"
          />
          <span className="text-[rgb(var(--muted))] text-sm opacity-50" aria-hidden>
            →
          </span>
        </div>
      </div>

      <div className="shrink-0 px-5 pt-6 pb-4 md:px-8 md:pt-8 md:pb-5 border-b border-[var(--news-line)]">
        <p className="text-[0.7rem] md:text-xs uppercase tracking-[0.28em] text-[rgb(var(--muted))]">
          {adminEditable ? (
            resolveCmsText(textOverrides, "news.titlePrefix", t("titlePrefix"))
          ) : (
            <CmsText contentKey="news.titlePrefix" as="span" />
          )}
        </p>
        <h2
          id="news-heading"
          className="mt-2 font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight text-[rgb(var(--text))] leading-[1.05]"
        >
          {adminEditable ? (
            resolveCmsText(textOverrides, "news.titleWord", t("titleWord"))
          ) : (
            <CmsText contentKey="news.titleWord" as="span" />
          )}
        </h2>
      </div>
    </>
  );

  return (
    <section
      className="news-editorial flex flex-col flex-1 min-h-0 w-full h-full"
      aria-labelledby="news-heading"
    >
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] grid-rows-1 gap-0 flex-1 min-h-0 h-full w-full border border-[var(--news-line)] rounded-2xl overflow-hidden bg-[rgb(var(--surface)/0.35)]">
        <div className="flex flex-col min-h-0 h-full max-h-full border-b lg:border-b-0 lg:border-r border-[var(--news-line)]">
          {adminEditable ? (
            <CmsEditableZone label="Encabezado de noticias" onEdit={adminEditable.onEditHeader}>
              {headerBlock}
            </CmsEditableZone>
          ) : (
            headerBlock
          )}

          <ul className="flex flex-col flex-1 min-h-0 overflow-y-auto overscroll-y-contain" role="list">
            {rows.length === 0 ? (
              <li className="px-5 py-10 md:px-8 text-sm text-[rgb(var(--muted))]">{t("empty")}</li>
            ) : (
              rows.map((row) => {
                const item = (
                  <li className="grid grid-cols-[auto_1fr] gap-x-4 md:gap-x-6 items-start px-5 py-4 md:px-8 md:py-5 border-b border-[var(--news-line)] last:border-b-0 transition-colors hover:bg-[rgb(var(--bg)/0.25)] shrink-0">
                    <span className="font-serif text-xl md:text-2xl text-[rgb(var(--text)/0.85)] tabular-nums pt-0.5">
                      {row.num}
                    </span>
                    <div>
                      <span className="text-[0.65rem] uppercase tracking-[0.18em] text-[rgb(var(--muted))]">
                        {row.category || "—"}
                      </span>
                      <p className="mt-1.5 text-[0.95rem] md:text-base leading-snug text-[rgb(var(--text))] font-medium">
                        {row.title}
                      </p>
                    </div>
                  </li>
                );

                if (!adminEditable) {
                  return (
                    <div key={row.id} role="listitem">
                      {item}
                    </div>
                  );
                }

                return (
                  <div key={row.id} role="listitem">
                    <CmsEditableZone
                      label={`Noticia: ${row.title}`}
                      unpublished={row.unpublished}
                      onEdit={() => adminEditable.onEditArticle(row.id)}
                      onToggleHide={
                        row.isFallback
                          ? undefined
                          : () => adminEditable.onToggleArticleVisibility(row.id)
                      }
                      onDelete={
                        row.isFallback ? undefined : () => adminEditable.onDeleteArticle(row.id)
                      }
                    >
                      {item}
                    </CmsEditableZone>
                  </div>
                );
              })
            )}
          </ul>
        </div>

        <div className="flex flex-col min-h-[min(40vh,320px)] lg:min-h-0 lg:h-full lg:max-h-full bg-[rgb(var(--bg)/0.25)] p-4 sm:p-6 md:p-8 lg:p-10 pointer-events-none">
          <div className="relative flex-1 min-h-[160px] lg:min-h-0">
            <div className="news-editorial__visual-main absolute inset-0 overflow-hidden bg-[rgb(var(--surface))]">
              <img
                src={imgMain}
                alt=""
                className="w-full h-full object-cover scale-105"
                loading="lazy"
                decoding="async"
              />
            </div>
          </div>
          <div className="mt-4 md:mt-6 h-28 sm:h-32 md:h-40 relative shrink-0">
            <div className="news-editorial__visual-sub absolute inset-0 overflow-hidden bg-[rgb(var(--surface))] opacity-95">
              <img
                src={imgSub}
                alt=""
                className="w-full h-full object-cover"
                loading="lazy"
                decoding="async"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
