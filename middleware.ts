import { type NextRequest } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { detectVisitorMarket } from "@/lib/site/detect";
import { localeForMarket, SITE_COOKIE, STORE_COOKIE, type SiteMarket } from "@/lib/site/market";

const handleI18nRouting = createIntlMiddleware(routing);

function marketFromCookie(value: string | undefined): SiteMarket | null {
  return value === "US" || value === "MX" ? value : null;
}

/** Locale routing. The first visit follows the visitor's country. */
export async function middleware(request: NextRequest) {
  const saved = marketFromCookie(request.cookies.get(SITE_COOKIE)?.value);
  const market = saved || (await detectVisitorMarket(request));
  if (!saved) {
    request.cookies.set(SITE_COOKIE, market);
    request.cookies.set(STORE_COOKIE, market);
    request.cookies.set("NEXT_LOCALE", localeForMarket(market));
  }

  const response = handleI18nRouting(request);
  if (!saved) {
    const options = { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" as const };
    response.cookies.set(SITE_COOKIE, market, options);
    response.cookies.set(STORE_COOKIE, market, options);
    response.cookies.set("NEXT_LOCALE", localeForMarket(market), options);
  }
  return response;
}

export const config = {
  matcher: ["/((?!api|auth|_next|_vercel|.*\\..*).*)"],
};
