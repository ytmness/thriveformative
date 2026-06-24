import type { Locale } from "@/lib/cms/types";

export type StoreCategory = {
  id: string;
  locale: string;
  name: string;
  slug: string;
  sort_order: number;
};

export type StoreProduct = {
  id: string;
  locale: string;
  sort_order: number;
  name: string;
  description: string;
  ref: string;
  referral_url: string;
  image_url: string | null;
  category_id: string | null;
  category: StoreCategory | null;
  is_published: boolean;
  price_min: number | null;
  price_max: number | null;
  compare_at_price_min: number | null;
  currency: string | null;
  source: string | null;
  source_handle: string | null;
};

export type { Locale };
