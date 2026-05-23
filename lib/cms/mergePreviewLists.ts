import type { CmsArticle, CmsPlan, CmsService, Locale } from "@/lib/cms/types";

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

function sortByOrder<T extends { sort_order: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => a.sort_order - b.sort_order);
}

/** CMS + traducciones: al añadir el primero no desaparecen los demás. */
export function mergePreviewServices(
  cmsItems: CmsService[],
  fallbacks: { name: string; description: string }[],
  locale: Locale
): PreviewServiceRow[] {
  const sorted = sortByOrder(cmsItems);
  const cmsRows: PreviewServiceRow[] = sorted.map((s) => ({
    id: s.id,
    name: s.name.trim() || "Sin nombre",
    desc: s.description.trim() || "…",
    unpublished: !s.is_published,
    isFallback: false,
    sort_order: s.sort_order,
  }));

  if (cmsRows.length === 0) {
    return fallbacks.map((fb, i) => ({
      id: `fallback-service-${i}`,
      name: fb.name,
      desc: fb.description,
      unpublished: false,
      isFallback: true,
      sort_order: i,
    }));
  }

  const extra = fallbacks.slice(cmsRows.length).map((fb, i) => ({
    id: `fallback-service-${cmsRows.length + i}`,
    name: fb.name,
    desc: fb.description,
    unpublished: false,
    isFallback: true,
    sort_order: cmsRows.length + i,
  }));

  return [...cmsRows, ...extra];
}

export function mergePreviewPlans(
  cmsItems: CmsPlan[],
  fallbacks: { name: string; items: string[]; is_featured: boolean }[]
): PreviewPlanRow[] {
  const sorted = sortByOrder(cmsItems);
  const cmsRows: PreviewPlanRow[] = sorted.map((p) => ({
    id: p.id,
    name: p.name.trim() || "Sin nombre",
    items: p.items.filter((x) => x.trim()).length ? p.items : ["…"],
    featured: p.is_featured,
    unpublished: !p.is_published,
    isFallback: false,
    sort_order: p.sort_order,
  }));

  if (cmsRows.length === 0) {
    return fallbacks.map((fb, i) => ({
      id: `fallback-plan-${i}`,
      name: fb.name,
      items: fb.items,
      featured: fb.is_featured,
      unpublished: false,
      isFallback: true,
      sort_order: i,
    }));
  }

  const extra = fallbacks.slice(cmsRows.length).map((fb, i) => ({
    id: `fallback-plan-${cmsRows.length + i}`,
    name: fb.name,
    items: fb.items,
    featured: fb.is_featured,
    unpublished: false,
    isFallback: true,
    sort_order: cmsRows.length + i,
  }));

  return [...cmsRows, ...extra];
}

export function buildFallbackArticles(
  locale: Locale,
  items: { category: string; title: string }[]
): CmsArticle[] {
  return items.map((item, i) => ({
    id: `fallback-article-${i}`,
    locale,
    sort_order: i,
    category: item.category,
    title: item.title,
    body: null,
    image_url: null,
    is_published: true,
    published_at: new Date().toISOString().slice(0, 10),
  }));
}

export function mergePreviewArticles(cmsItems: CmsArticle[], fallbacks: CmsArticle[]): CmsArticle[] {
  const sorted = sortByOrder(cmsItems);
  if (sorted.length === 0) return fallbacks;
  const extra = fallbacks.slice(sorted.length);
  return [...sorted, ...extra];
}
