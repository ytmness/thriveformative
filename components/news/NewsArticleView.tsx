"use client";

import { useTranslations } from "next-intl";
import { formatArticleBody } from "@/lib/news/formatArticleBody";
import type { CmsArticle } from "@/lib/cms/types";

const IMG_DEFAULT =
  "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=900&q=80";

type Props = {
  article: CmsArticle;
  displayIndex: number;
  onBack: () => void;
  onEdit?: () => void;
  unpublished?: boolean;
};

export default function NewsArticleView({
  article,
  displayIndex,
  onBack,
  onEdit,
  unpublished,
}: Props) {
  const t = useTranslations("news");
  const paragraphs = formatArticleBody(article.body);
  const num = String(displayIndex + 1).padStart(2, "0");
  const title = article.title?.trim() || t("untitled");
  const imageUrl = article.image_url?.trim() || IMG_DEFAULT;

  return (
    <article className="news-wiki-article" aria-labelledby="news-article-title">
      <nav className="news-wiki-article__breadcrumb" aria-label={t("breadcrumbLabel")}>
        <button type="button" className="news-wiki-article__back" onClick={onBack}>
          ← {t("backToList")}
        </button>
        {onEdit ? (
          <button type="button" className="news-wiki-article__edit" onClick={onEdit}>
            {t("editArticle")}
          </button>
        ) : null}
      </nav>

      {unpublished ? (
        <p className="news-wiki-article__draft" role="status">
          {t("draftBadge")}
        </p>
      ) : null}

      <header className="news-wiki-article__header">
        <p className="news-wiki-article__meta">
          <span className="news-wiki-article__num">{num}</span>
          {article.category ? (
            <>
              <span className="news-wiki-article__sep" aria-hidden>
                ·
              </span>
              <span className="news-wiki-article__category">{article.category}</span>
            </>
          ) : null}
        </p>
        <h1 id="news-article-title" className="news-wiki-article__title">
          {title}
        </h1>
        {article.published_at ? (
          <p className="news-wiki-article__date">
            {t("publishedOn", { date: article.published_at })}
          </p>
        ) : null}
      </header>

      <div className="news-wiki-article__layout">
        <aside className="news-wiki-article__infobox" aria-label={t("infoboxLabel")}>
          <div className="news-wiki-article__infobox-inner">
            <img src={imageUrl} alt="" className="news-wiki-article__infobox-img" loading="lazy" />
            <dl className="news-wiki-article__infobox-dl">
              <div>
                <dt>{t("infoboxCategory")}</dt>
                <dd>{article.category || "—"}</dd>
              </div>
              <div>
                <dt>{t("infoboxIndex")}</dt>
                <dd>{num}</dd>
              </div>
            </dl>
          </div>
        </aside>

        <div className="news-wiki-article__body prose-news">
          {paragraphs.length > 0 ? (
            paragraphs.map((p, i) => <p key={i}>{p}</p>)
          ) : (
            <p className="news-wiki-article__placeholder">{t("noBody")}</p>
          )}
        </div>
      </div>
    </article>
  );
}
