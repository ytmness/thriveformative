/** Columnas públicas de store_products (sin source_payload). */
export const PRODUCT_FIELDS =
  "id, locale, country, sort_order, name, description, ref, referral_url, image_url, image_urls, category_id, is_published, price_min, price_max, compare_at_price_min, currency, source, source_handle";

/** Lista SQL (misma columnas) para consultas pg. */
export const PRODUCT_FIELDS_SQL = PRODUCT_FIELDS;

/** Incluye source_payload — solo admin / scripts de importación. */
export const PRODUCT_FIELDS_ADMIN = `${PRODUCT_FIELDS}, source_payload`;

export type ProductRow = {
  id: string;
  locale: string;
  country: string;
  sort_order: number;
  name: string;
  description: string;
  ref: string;
  referral_url: string;
  image_url: string | null;
  image_urls: string[] | null;
  category_id: string | null;
  is_published: boolean;
  price_min: number | null;
  price_max: number | null;
  compare_at_price_min: number | null;
  currency: string | null;
  source: string | null;
  source_handle: string | null;
  source_payload?: Record<string, unknown> | null;
};
