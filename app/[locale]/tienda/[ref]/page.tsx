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
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

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

      <main className="max-w-4xl mx-auto px-6 py-16 md:py-24">
        <Link
          href={`/${locale}/tienda`}
          className="type-ui text-sm text-[rgb(var(--primary))] hover:opacity-80 inline-flex items-center gap-1 mb-10"
        >
          ← {t("backToStore")}
        </Link>

        {loading ? (
          <div className="animate-pulse space-y-6">
            <div className="aspect-[16/10] rounded-2xl bg-surface border border-theme" />
            <div className="h-8 w-2/3 rounded bg-surface border border-theme" />
            <div className="h-24 rounded bg-surface border border-theme" />
          </div>
        ) : notFound || !product ? (
          <div className="text-center py-16">
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
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {product.image_url ? (
              <div className="rounded-2xl overflow-hidden border border-theme shadow-soft aspect-[16/10] bg-[rgb(var(--primary)/0.06)]">
                <img
                  src={product.image_url}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>
            ) : null}

            <h1 className="type-page-title tracking-wide mt-10">{product.name}</h1>

            {product.description ? (
              <p className="type-body mt-6 whitespace-pre-wrap">{product.description}</p>
            ) : null}

            <div className="mt-10 flex flex-wrap gap-4">
              <BrandCtaLink
                href={product.referral_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                {t("buyExternal")}
              </BrandCtaLink>
            </div>

            <p className="type-caption text-muted mt-6">{t("externalDisclaimer")}</p>
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
