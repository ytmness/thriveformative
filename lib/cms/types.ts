import type { Locale } from "@/i18n/config";

export type { Locale };

export type CmsService = {
  id: string;
  locale: string;
  sort_order: number;
  name: string;
  description: string;
  is_published: boolean;
};

export type CmsPlan = {
  id: string;
  locale: string;
  sort_order: number;
  name: string;
  items: string[];
  is_featured: boolean;
  is_published: boolean;
};

export type CmsArticle = {
  id: string;
  locale: string;
  sort_order: number;
  category: string;
  title: string;
  body: string | null;
  image_url: string | null;
  is_published: boolean;
  published_at: string | null;
};

export type CmsTextEntry = {
  id: string;
  locale: string;
  content_key: string;
  value: string;
};

export type CmsBundle = {
  services: CmsService[];
  plans: CmsPlan[];
  articles: CmsArticle[];
  textOverrides: Record<string, string>;
};

export const CMS_LOCALES: Locale[] = ["es", "en", "ko", "it"];
