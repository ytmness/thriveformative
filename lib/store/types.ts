import type { Locale } from "@/lib/cms/types";

export type StoreProduct = {
  id: string;
  locale: string;
  sort_order: number;
  name: string;
  description: string;
  ref: string;
  referral_url: string;
  image_url: string | null;
  is_published: boolean;
};

export type { Locale };
