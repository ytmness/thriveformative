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
};

export type { Locale };
