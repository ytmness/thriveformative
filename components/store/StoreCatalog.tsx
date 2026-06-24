"use client";

import { motion } from "framer-motion";
import { ExternalLink, Search, X } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import StoreProductPrice from "@/components/store/StoreProductPrice";
import { fetchStoreCategories, fetchStoreProducts } from "@/lib/store/fetch";
import { productMatchesQuery } from "@/lib/store/search";
import type { Locale } from "@/lib/cms/types";
import type { StoreCategory, StoreProduct } from "@/lib/store/types";
import "@/app/styles/tienda.css";

export default function StoreCatalog() {
  const t = useTranslations("tienda");
  const locale = useLocale();
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [categories, setCategories] = useState<StoreCategory[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    Promise.all([
      fetchStoreProducts(locale as Locale),
      fetchStoreCategories(locale as Locale),
    ])
      .then(([rows, cats]) => {
        if (!cancelled) {
          setProducts(rows);
          setCategories(cats);
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : t("loadError"));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [locale, t]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const categoryOk = !activeCategory || p.category?.slug === activeCategory;
      const searchOk = productMatchesQuery(p, query);
      return categoryOk && searchOk;
    });
  }, [products, activeCategory, query]);

  if (loading) {
    return (
      <div className="tienda-catalog" aria-busy="true" aria-label={t("loading")}>
        {[1, 2, 3].map((i) => (
          <div key={i} className="tienda-skeleton">
            <div className="tienda-skeleton__media" />
            <div className="tienda-skeleton__body">
              <div className="tienda-skeleton__line tienda-skeleton__line--short" />
              <div className="tienda-skeleton__line tienda-skeleton__line--title" />
              <div className="tienda-skeleton__line" />
              <div className="tienda-skeleton__btn" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return <p className="tienda-empty type-body-muted">{error}</p>;
  }

  if (!products.length) {
    return <p className="tienda-empty type-body-muted">{t("empty")}</p>;
  }

  const hasActiveFilters = Boolean(activeCategory || query.trim());

  return (
    <>
      <div className="tienda-toolbar">
        <div className="tienda-search">
          <Search className="tienda-search__icon" size={17} strokeWidth={2} aria-hidden />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="tienda-search__input"
            aria-label={t("searchPlaceholder")}
          />
          {query ? (
            <button
              type="button"
              className="tienda-search__clear"
              onClick={() => setQuery("")}
              aria-label={t("searchClear")}
            >
              <X size={15} strokeWidth={2.25} />
            </button>
          ) : null}
        </div>

        {categories.length > 0 ? (
          <div className="tienda-filters" role="tablist" aria-label={t("filterLabel")}>
            <button
              type="button"
              role="tab"
              aria-selected={activeCategory === null}
              className={`tienda-filters__chip${activeCategory === null ? " tienda-filters__chip--active" : ""}`}
              onClick={() => setActiveCategory(null)}
            >
              {t("allCategories")}
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                role="tab"
                aria-selected={activeCategory === cat.slug}
                className={`tienda-filters__chip${
                  activeCategory === cat.slug ? " tienda-filters__chip--active" : ""
                }`}
                onClick={() => setActiveCategory(cat.slug)}
              >
                {cat.name}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {filteredProducts.length === 0 ? (
        <p className="tienda-empty type-body-muted">
          {query.trim() ? t("searchEmpty") : t("emptyCategory")}
        </p>
      ) : (
        <div className="tienda-catalog">
          {filteredProducts.map((product, i) => (
            <ProductCard key={product.id} product={product} locale={locale} index={i} />
          ))}
        </div>
      )}

      {hasActiveFilters && filteredProducts.length > 0 ? (
        <p className="type-caption text-center mt-8">
          {filteredProducts.length}{" "}
          {filteredProducts.length === 1 ? t("resultSingular") : t("resultPlural")}
        </p>
      ) : null}
    </>
  );
}

function ProductCard({
  product,
  locale,
  index,
}: {
  product: StoreProduct;
  locale: string;
  index: number;
}) {
  const t = useTranslations("tienda");
  const detailHref = `/${locale}/tienda/${product.ref}`;

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, delay: Math.min(index * 0.05, 0.35), ease: "easeOut" }}
      className="tienda-card"
    >
      <Link href={detailHref} className="tienda-card__media-link">
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.name}
            width={400}
            height={400}
            className="tienda-card__image"
            sizes="(max-width: 768px) 100vw, 280px"
          />
        ) : (
          <span className="tienda-card__media-placeholder">{t("noImage")}</span>
        )}
      </Link>

      <div className="tienda-card__body">
        <span className="tienda-card__eyebrow">
          {product.category?.name ?? t("cardEyebrow")}
        </span>
        <h2 className="tienda-card__title">
          <Link href={detailHref}>{product.name}</Link>
        </h2>

        <StoreProductPrice
          product={product}
          locale={locale}
          priceFromLabel={t("priceFrom")}
        />

        {product.description ? (
          <p className="tienda-card__desc">{product.description}</p>
        ) : null}

        <div className="tienda-card__actions">
          <a
            href={product.referral_url}
            target="_blank"
            rel="noopener noreferrer"
            className="tienda-card__buy"
          >
            {t("buyExternal")}
            <ExternalLink size={14} strokeWidth={2.25} aria-hidden />
          </a>
          <Link href={detailHref} className="tienda-card__detail">
            {t("viewProduct")} →
          </Link>
        </div>
      </div>
    </motion.article>
  );
}
