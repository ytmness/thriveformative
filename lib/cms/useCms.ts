"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { fetchCmsBundle } from "@/lib/cms/fetch";
import type { CmsBundle } from "@/lib/cms/types";
import type { Locale } from "@/i18n/config";

const EMPTY: CmsBundle = {
  services: [],
  plans: [],
  articles: [],
  textOverrides: {},
};

export function useCms(localeOverride?: Locale) {
  const localeFromHook = useLocale() as Locale;
  const locale = localeOverride ?? localeFromHook;
  const [data, setData] = useState<CmsBundle>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchCmsBundle(locale)
      .then((bundle) => {
        if (!cancelled) setData(bundle);
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Error al cargar contenido");
          setData(EMPTY);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [locale]);

  return { ...data, loading, error, locale };
}
