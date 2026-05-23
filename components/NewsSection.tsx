"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocale } from "next-intl";
import { useTranslations } from "next-intl";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import CmsEditableZone from "@/components/admin/cms/CmsEditableZone";
import { useCmsContext } from "@/components/cms/CmsProvider";
import CmsText from "@/components/cms/CmsText";
import NewsArticleView from "@/components/news/NewsArticleView";
import { resolveCmsText } from "@/lib/cms/fetch";
import { buildFallbackArticles } from "@/lib/cms/mergePreviewLists";
import { resolveArticlesForDisplay } from "@/lib/cms/resolveDisplay";
import { formatArticleBody } from "@/lib/news/formatArticleBody";
import type { CmsArticle, Locale } from "@/lib/cms/types";
import "./news-section.css";

const ITEM_KEYS = ["a1", "a2", "a3", "a4", "a5"] as const;
const ARTICLES_PER_PAGE = 5;

export type NewsSectionAdminEditable = {
  onEditArticle: (id: string) => void;
  onAddArticle: () => void;
  onToggleArticleVisibility: (id: string) => void;
  onDeleteArticle: (id: string) => void;
  onEditHeader: () => void;
};

type Props = {
  adminEditable?: NewsSectionAdminEditable;
  /** Id de artículo controlado (vista previa CMS) */
  articleId?: string | null;
  onArticleIdChange?: (id: string | null) => void;
  /** Sincronizar artículo con ?article= en la URL (/noticias) */
  syncArticleInUrl?: boolean;
};

export default function NewsSection({
  adminEditable,
  articleId: controlledArticleId,
  onArticleIdChange,
  syncArticleInUrl = false,
}: Props) {
  const t = useTranslations("news");
  const pageLocale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { articles: cmsArticles, textOverrides } = useCmsContext();
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [internalArticleId, setInternalArticleId] = useState<string | null>(null);

  const urlArticleId = syncArticleInUrl ? searchParams.get("article") : null;
  const selectedArticleId =
    controlledArticleId !== undefined ? controlledArticleId : internalArticleId ?? urlArticleId;

  const setSelectedArticleId = useCallback(
    (id: string | null) => {
      if (onArticleIdChange) onArticleIdChange(id);
      else setInternalArticleId(id);

      if (syncArticleInUrl) {
        const params = new URLSearchParams(searchParams.toString());
        if (id) params.set("article", id);
        else params.delete("article");
        const qs = params.toString();
        router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
      }
    },
    [onArticleIdChange, syncArticleInUrl, searchParams, pathname, router]
  );

  const fallbackArticles = useMemo(
    () =>
      buildFallbackArticles(
        pageLocale,
        ITEM_KEYS.map((key) => {
          let body: string | null = null;
          try {
            body = t(`items.${key}.body`);
          } catch {
            body = null;
          }
          return {
            category: t(`items.${key}.category`),
            title: t(`items.${key}.title`),
            body,
          };
        })
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

  const articleById = useMemo(() => {
    const map = new Map<string, CmsArticle>();
    for (const a of displayArticles) map.set(a.id, a);
    return map;
  }, [displayArticles]);

  const selectedArticle = selectedArticleId ? articleById.get(selectedArticleId) : undefined;
  const selectedIndex =
    selectedArticle != null
      ? displayArticles.findIndex((a) => a.id === selectedArticle.id)
      : -1;

  useEffect(() => {
    if (selectedArticleId && !articleById.has(selectedArticleId)) {
      setSelectedArticleId(null);
    }
  }, [selectedArticleId, articleById, setSelectedArticleId]);

  useEffect(() => {
    setPage(1);
  }, [query]);

  const filteredArticles = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return displayArticles;
    return displayArticles.filter((a) =>
      `${a.category} ${a.title} ${a.body ?? ""}`.toLowerCase().includes(q)
    );
  }, [displayArticles, query]);

  const totalPages = Math.max(1, Math.ceil(filteredArticles.length / ARTICLES_PER_PAGE));
  const safePage = Math.min(page, totalPages);

  const pageArticles = useMemo(() => {
    const start = (safePage - 1) * ARTICLES_PER_PAGE;
    return filteredArticles.slice(start, start + ARTICLES_PER_PAGE);
  }, [filteredArticles, safePage]);

  const searchPlaceholder = resolveCmsText(
    textOverrides,
    "news.searchPlaceholder",
    t("searchPlaceholder")
  );

  const headerBlock = (
    <>
      <p className="news-hub__eyebrow">
        {adminEditable ? (
          resolveCmsText(textOverrides, "news.label", t("label"))
        ) : (
          <CmsText contentKey="news.label" as="span" />
        )}
      </p>
      <h2 id="news-heading" className="news-hub__title">
        {adminEditable ? (
          <>
            {resolveCmsText(textOverrides, "news.titlePrefix", t("titlePrefix"))}{" "}
            <span className="news-hub__title-accent">
              {resolveCmsText(textOverrides, "news.titleWord", t("titleWord"))}
            </span>
          </>
        ) : (
          <>
            <CmsText contentKey="news.titlePrefix" as="span" />{" "}
            <span className="news-hub__title-accent">
              <CmsText contentKey="news.titleWord" as="span" />
            </span>
          </>
        )}
      </h2>
    </>
  );

  if (selectedArticle && selectedIndex >= 0) {
    const view = (
      <NewsArticleView
        article={selectedArticle}
        displayIndex={selectedIndex}
        onBack={() => setSelectedArticleId(null)}
        onEdit={adminEditable ? () => adminEditable.onEditArticle(selectedArticle.id) : undefined}
        unpublished={!selectedArticle.is_published}
      />
    );

    return (
      <section
        id="noticias"
        className="news-hub news-hub--article"
        aria-labelledby="news-article-title"
      >
        <div className="news-hub__contain">
          {adminEditable ? (
            <CmsEditableZone
              label={`Artículo: ${selectedArticle.title || t("untitled")}`}
              unpublished={!selectedArticle.is_published}
              onEdit={() => adminEditable.onEditArticle(selectedArticle.id)}
              onToggleHide={
                selectedArticle.id.startsWith("fallback-article-")
                  ? undefined
                  : () => adminEditable.onToggleArticleVisibility(selectedArticle.id)
              }
              onDelete={
                selectedArticle.id.startsWith("fallback-article-")
                  ? undefined
                  : () => {
                      adminEditable.onDeleteArticle(selectedArticle.id);
                      setSelectedArticleId(null);
                    }
              }
            >
              {view}
            </CmsEditableZone>
          ) : (
            view
          )}
        </div>
      </section>
    );
  }

  return (
    <section id="noticias" className="news-hub" aria-labelledby="news-heading">
      <div className="news-hub__contain">
        {adminEditable ? (
          <CmsEditableZone label="Encabezado de noticias" onEdit={adminEditable.onEditHeader}>
            <header className="news-hub__header">{headerBlock}</header>
          </CmsEditableZone>
        ) : (
          <header className="news-hub__header">{headerBlock}</header>
        )}

        <div className="news-hub__search-row">
          <label className="sr-only" htmlFor="news-search">
            {t("searchLabel")}
          </label>
          <div className="news-hub__search">
            <svg
              className="news-hub__search-icon"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
              aria-hidden
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z"
              />
            </svg>
            <input
              id="news-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="news-hub__search-input"
              autoComplete="off"
            />
          </div>
        </div>

        <ul className="news-hub__list" role="list">
          {pageArticles.length === 0 ? (
            <li className="news-hub__empty">{t("empty")}</li>
          ) : (
            pageArticles.map((article, i) => {
              const globalIndex = (safePage - 1) * ARTICLES_PER_PAGE + i;
              const num = String(globalIndex + 1).padStart(2, "0");
              const title = article.title?.trim() || t("untitled");
              const excerpt =
                formatArticleBody(article.body)[0]?.slice(0, 140) ??
                t("readMore");

              const row = (
                <li className="news-hub__item">
                  <button
                    type="button"
                    className="news-hub__item-btn"
                    onClick={() => setSelectedArticleId(article.id)}
                  >
                    <span className="news-hub__item-num">{num}</span>
                    <span className="news-hub__item-body">
                      <span className="news-hub__item-cat">{article.category || "—"}</span>
                      <span className="news-hub__item-title">{title}</span>
                      <span className="news-hub__item-excerpt">{excerpt}</span>
                    </span>
                    <span className="news-hub__item-arrow" aria-hidden>
                      →
                    </span>
                  </button>
                </li>
              );

              if (!adminEditable) return <div key={article.id}>{row}</div>;

              return (
                <div key={article.id} role="listitem">
                  <CmsEditableZone
                    label={`Noticia: ${title}`}
                    unpublished={!article.is_published}
                    onEdit={() => adminEditable.onEditArticle(article.id)}
                    onToggleHide={
                      article.id.startsWith("fallback-article-")
                        ? undefined
                        : () => adminEditable.onToggleArticleVisibility(article.id)
                    }
                    onDelete={
                      article.id.startsWith("fallback-article-")
                        ? undefined
                        : () => adminEditable.onDeleteArticle(article.id)
                    }
                  >
                    {row}
                  </CmsEditableZone>
                </div>
              );
            })
          )}
        </ul>

        {totalPages > 1 ? (
          <nav className="news-hub__pagination" aria-label={t("paginationLabel")}>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                type="button"
                className={`news-hub__page-btn ${n === safePage ? "news-hub__page-btn--active" : ""}`}
                onClick={() => setPage(n)}
                aria-current={n === safePage ? "page" : undefined}
              >
                {n}
              </button>
            ))}
          </nav>
        ) : null}
      </div>
    </section>
  );
}
