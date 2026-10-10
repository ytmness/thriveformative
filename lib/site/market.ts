export type SiteMarket = "MX" | "US";

export const SITE_COOKIE = "tf-site";
export const STORE_COOKIE = "tf-store-country";

export function localeForMarket(market: SiteMarket) {
  return market === "US" ? "en" : "es";
}

export function readCookie(name: string) {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export function readMarket(): SiteMarket {
  const site = readCookie(SITE_COOKIE);
  if (site === "US" || site === "MX") return site;
  const store = readCookie(STORE_COOKIE);
  if (store === "US" || store === "MX") return store;
  if (typeof window !== "undefined") {
    const saved = window.localStorage.getItem(STORE_COOKIE);
    if (saved === "US" || saved === "MX") return saved;
  }
  return "MX";
}

export function writeMarket(market: SiteMarket) {
  const base = "path=/; max-age=31536000; SameSite=Lax";
  document.cookie = `${SITE_COOKIE}=${market}; ${base}`;
  document.cookie = `${STORE_COOKIE}=${market}; ${base}`;
  document.cookie = `NEXT_LOCALE=${localeForMarket(market)}; ${base}`;
  window.localStorage.setItem(STORE_COOKIE, market);
}
