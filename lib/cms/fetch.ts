import type { CmsBundle, Locale } from "@/lib/cms/types";

export function resolveCmsText(
  overrides: Record<string, string>,
  key: string,
  fallback: string
): string {
  const v = overrides[key];
  return v?.trim() ? v : fallback;
}

/**
 * Carga el bundle CMS.
 * En el browser llama a /api/cms/bundle (Postgres local vía server).
 * En el server usa lib/cms/db directamente.
 */
export async function fetchCmsBundle(
  locale: Locale,
  options?: { includeUnpublished?: boolean }
): Promise<CmsBundle> {
  if (typeof window === "undefined") {
    const { fetchCmsBundleFromDb } = await import("@/lib/cms/db");
    return fetchCmsBundleFromDb(locale, options);
  }

  const params = new URLSearchParams({ locale });
  if (options?.includeUnpublished) params.set("all", "1");
  const res = await fetch(`/api/cms/bundle?${params.toString()}`, {
    credentials: "same-origin",
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body.error || `CMS error ${res.status}`);
  }
  return body as CmsBundle;
}
