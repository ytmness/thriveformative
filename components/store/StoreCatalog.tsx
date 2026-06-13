"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { fetchStoreProducts } from "@/lib/store/fetch";
import type { Locale } from "@/lib/cms/types";
import type { StoreProduct } from "@/lib/store/types";

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
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-80 rounded-2xl border border-theme bg-surface animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <p className="type-body-muted text-center py-12">{error}</p>
    );
  }

  if (!products.length) {
    return (
      <p className="type-body-muted text-center py-12">{t("empty")}</p>
    );
  }

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
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
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.06 }}
      whileHover={{ y: -4, boxShadow: "0 20px 50px rgba(0,0,0,0.12)" }}
      className="bg-surface border border-theme rounded-2xl shadow-soft overflow-hidden flex flex-col"
    >
      <Link href={detailHref} className="block aspect-[4/3] bg-[rgb(var(--primary)/0.06)] overflow-hidden">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt=""
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center type-caption text-muted uppercase tracking-wider">
            {t("noImage")}
          </div>
        )}
      </Link>

      <div className="p-6 flex flex-col flex-1">
        <h2 className="type-card-name tracking-wide">
          <Link href={detailHref} className="hover:text-[rgb(var(--primary))] transition-colors">
            {product.name}
          </Link>
        </h2>
        {product.description ? (
          <p className="type-body-muted mt-3 line-clamp-3 flex-1">{product.description}</p>
        ) : null}
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href={detailHref}
            className="type-ui text-sm font-medium text-[rgb(var(--primary))] hover:opacity-80"
          >
            {t("viewProduct")}
          </Link>
          <a
            href={product.referral_url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-outline type-ui text-sm font-medium rounded-lg px-4 py-2"
          >
            {t("buyExternal")}
          </a>
        </div>
      </div>
    </motion.article>
  );
}
