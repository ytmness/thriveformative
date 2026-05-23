import type { CmsArticle, Locale } from "@/lib/cms/types";

export type PreviewServiceRow = {
  id: string;
  name: string;
  desc: string;
  unpublished: boolean;
  isFallback: boolean;
  sort_order: number;
};

export type PreviewPlanRow = {
  id: string;
  name: string;
  items: string[];
  featured: boolean;
  unpublished: boolean;
  isFallback: boolean;
  sort_order: number;
};

export function buildFallbackArticles(
  locale: Locale,
  items: { category: string; title: string; body?: string | null }[]
): CmsArticle[] {
  return items.map((item, i) => ({
    id: `fallback-article-${i}`,
    locale,
    sort_order: i,
    category: item.category,
    title: item.title,
    body: item.body?.trim() || null,
    image_url: null,
    is_published: true,
    published_at: new Date().toISOString().slice(0, 10),
  }));
}

export {
  resolveArticlesForDisplay as mergePreviewArticles,
  resolveServicesForDisplay as mergePreviewServices,
  resolvePlansForDisplay as mergePreviewPlans,
  isEphemeralCmsId,
} from "@/lib/cms/resolveDisplay";
