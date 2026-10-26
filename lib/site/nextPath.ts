const LOCALES = ["es", "en", "ko", "it"];

export function safeNextPath(raw: string | null | undefined, locale: string): string {
  const fallback = `/${locale}`;
  const value = (raw || "").trim();
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("://")) return fallback;
  if (LOCALES.some((code) => value === `/${code}` || value.startsWith(`/${code}/`))) return value;
  return fallback;
}
