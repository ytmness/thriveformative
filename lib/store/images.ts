const MAX_PRODUCT_IMAGES = 8;

export function productImageList(product: {
  image_url?: string | null;
  image_urls?: string[] | null;
}): string[] {
  const fromList = Array.isArray(product.image_urls)
    ? product.image_urls.map((url) => String(url || "").trim()).filter(Boolean)
    : [];
  if (fromList.length) return [...new Set(fromList)].slice(0, MAX_PRODUCT_IMAGES);
  const cover = product.image_url?.trim();
  return cover ? [cover] : [];
}

export function cleanProductImages(raw: unknown, fallback?: unknown): string[] {
  return productImageList({
    image_urls: Array.isArray(raw) ? raw.map((item) => String(item ?? "")) : [],
    image_url: typeof fallback === "string" ? fallback : null,
  }).filter((url) => url.startsWith("/") || /^https?:\/\//i.test(url));
}
