"use client";

import ThemeProvider from "@/components/theme/ThemeProvider";
import ThemeSwitcher from "@/components/theme/ThemeSwitcher";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WaveDivider from "@/components/WaveDivider";
import BrandCtaLink from "@/components/ui/BrandCtaLink";
import { fetchStoreProductByRef } from "@/lib/store/fetch";
import type { Locale } from "@/lib/cms/types";
import type { StoreProduct } from "@/lib/store/types";
import { motion } from "framer-motion";
import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import "@/app/styles/tienda.css";

function ProductDetailContent() {
  const t = useTranslations("tienda");
  const locale = useLocale();
  const params = useParams();
  const ref = typeof params.ref === "string" ? params.ref : "";
  const [product, setProduct] = useState<StoreProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!ref) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setNotFound(false);
    fetchStoreProductByRef(locale as Locale, ref)
      .then((row) => {
        if (cancelled) return;
        if (!row) setNotFound(true);
        else setProduct(row);
      })
      .catch(() => {
        if (!cancelled) setNotFound(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [locale, ref]);

  return (
    <>
      <ThemeSwitcher />
      <Header />

      <main className="tienda-main max-w-6xl mx-auto px-6 py-16 md:py-24">
        <Link
          href={`/${locale}/tienda`}
          className="type-ui text-sm text-[rgb(var(--primary))] hover:opacity-80 inline-flex items-center gap-1 mb-10"
        >
          ← {t("backToStore")}
        </Link>

        {loading ? (
          <div className="tienda-detail animate-pulse">
            <div className="tienda-detail__media bg-surface border border-theme" />
            <div className="space-y-4">
              <div className="h-4 w-24 rounded bg-surface border border-theme" />
              <div className="h-10 w-2/3 rounded bg-surface border border-theme" />
              <div className="h-24 rounded bg-surface border border-theme" />
            </div>
          </div>
        ) : notFound || !product ? (
          <div className="tienda-empty text-center py-16">
            <h1 className="type-section-title">{t("notFoundTitle")}</h1>
            <p className="type-body-muted mt-4">{t("notFoundBody")}</p>
            <Link
              href={`/${locale}/tienda`}
              className="inline-block mt-8 type-ui font-medium text-[rgb(var(--primary))] hover:opacity-80"
            >
              {t("backToStore")}
            </Link>
          </div>
        ) : (
          <motion.div
            className="tienda-detail"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="tienda-detail__media">
              {product.image_url ? (
                <img src={product.image_url} alt={product.name} />
              ) : (
                <div className="w-full h-full flex items-center justify-center type-caption text-muted uppercase tracking-wider">
                  {t("noImage")}
                </div>
              )}
            </div>

            <div className="tienda-detail__panel">
              <p className="tienda-detail__eyebrow">{t("cardEyebrow")}</p>
              <h1 className="type-page-title tracking-wide tienda-detail__title">{product.name}</h1>

              {product.description ? (
                <p className="type-body tienda-detail__desc">{product.description}</p>
              ) : null}

              <div className="tienda-detail__cta-wrap">
                <BrandCtaLink
                  href={product.referral_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  block
                  className="inline-flex items-center justify-center gap-2"
                >
                  <span className="inline-flex items-center gap-2">
                    {t("buyExternal")}
                    <ExternalLink size={16} strokeWidth={2.25} aria-hidden />
                  </span>
                </BrandCtaLink>
                <p className="tienda-detail__disclaimer">{t("externalDisclaimer")}</p>
              </div>
            </div>
          </motion.div>
        )}
      </main>

      <WaveDivider variant="primary" flip />
      <Footer />
    </>
  );
}

export default function ProductDetailPage() {
  return (
    <ThemeProvider>
      <ProductDetailContent />
    </ThemeProvider>
  );
}
