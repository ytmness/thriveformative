export function sellsOnSite(product: { referral_url?: string | null; price_min?: number | null }) {
  const referral = (product.referral_url || "").trim();
  return !referral && product.price_min != null && Number(product.price_min) > 0;
}
