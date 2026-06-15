"use client";

import { motion } from "framer-motion";
import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { fetchStoreProducts } from "@/lib/store/fetch";
import type { Locale } from "@/lib/cms/types";
import type { StoreProduct } from "@/lib/store/types";
import "@/app/styles/tienda.css";

export default function StoreCatalog() {
  const t = useTranslations("tienda");
  const locale = useLocale();
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchStoreProducts(locale as Locale)
      .then((rows) => {
        if (!cancelled) setProducts(rows);
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

  return (
    <div className="tienda-catalog">
      {products.map((product, i) => (
        <ProductCard key={product.id} product={product} locale={locale} index={i} />
      ))}
    </div>
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
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.55, delay: index * 0.07, ease: "easeOut" }}
      className="tienda-card"
    >
      <Link href={detailHref} className="tienda-card__media-link">
        {product.image_url ? (
          <>
            <img src={product.image_url} alt={product.name} />
            <span className="tienda-card__media-overlay" aria-hidden />
          </>
        ) : (
          <span className="tienda-card__media-placeholder">{t("noImage")}</span>
        )}
      </Link>

      <div className="tienda-card__body">
        <span className="tienda-card__eyebrow">{t("cardEyebrow")}</span>
        <h2 className="tienda-card__title">
          <Link href={detailHref}>{product.name}</Link>
        </h2>
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
            <ExternalLink size={15} strokeWidth={2.25} aria-hidden />
          </a>
          <Link href={detailHref} className="tienda-card__detail">
            {t("viewProduct")} →
          </Link>
        </div>
      </div>
    </motion.article>
  );
}
