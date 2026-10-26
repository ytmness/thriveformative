export function sellsOnSite(product: {
  referral_url?: string | null;
  price_min?: number | null;
  source?: string | null;
}) {
  if (product.price_min == null || Number(product.price_min) <= 0) return false;
  if ((product.source || "").trim() === "square") return true;
  return !(product.referral_url || "").trim();
}
