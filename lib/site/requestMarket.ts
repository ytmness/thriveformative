import { cookies } from "next/headers";
import { SITE_COOKIE, STORE_COOKIE, type SiteMarket } from "@/lib/site/market";

export async function requestMarket(): Promise<SiteMarket> {
  const jar = await cookies();
  const site = jar.get(SITE_COOKIE)?.value;
  if (site === "US" || site === "MX") return site;
  const store = jar.get(STORE_COOKIE)?.value;
  if (store === "US" || store === "MX") return store;
  return "MX";
}
