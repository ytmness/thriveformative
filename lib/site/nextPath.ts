const LOCALES = ["es", "en", "ko", "it"];
const NEXT_STORAGE_KEY = "thrive_auth_next";

function splitQuery(value: string) {
  const i = value.indexOf("?");
  return i >= 0 ? { path: value.slice(0, i), query: value.slice(i) } : { path: value, query: "" };
}

export function safeNextPath(raw: string | null | undefined, locale: string): string {
  const fallback = `/${locale}`;
  const value = (raw || "").trim();
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("://")) return fallback;
  const { path, query } = splitQuery(value);
  if (path.startsWith("/admin") || path.startsWith("/api")) return fallback;
  const hasLocale = LOCALES.some((code) => path === `/${code}` || path.startsWith(`/${code}/`));
  const resolved = hasLocale ? path : path === "/" ? fallback : `/${locale}${path}`;
  return resolved + query;
}

export function rememberNextPath(raw: string | null | undefined) {
  if (typeof window === "undefined") return;
  const value = (raw || "").trim();
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("://")) return;
  try {
    sessionStorage.setItem(NEXT_STORAGE_KEY, value);
  } catch {
    /* ignore */
  }
}

export function consumeNextPath(raw: string | null | undefined, locale: string) {
  let stored = "";
  if (typeof window !== "undefined") {
    try {
      stored = sessionStorage.getItem(NEXT_STORAGE_KEY) || "";
      sessionStorage.removeItem(NEXT_STORAGE_KEY);
    } catch {
      stored = "";
    }
  }
  return safeNextPath(raw || stored, locale);
}
