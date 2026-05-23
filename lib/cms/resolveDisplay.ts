import type { CmsArticle, CmsPlan, CmsService } from "@/lib/cms/types";
import type { PreviewPlanRow, PreviewServiceRow } from "@/lib/cms/mergePreviewLists";

function sortByOrder<T extends { sort_order: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => a.sort_order - b.sort_order);
}

function isFallbackId(id: string): boolean {
  return id.startsWith("fallback-");
}

export function isEphemeralCmsId(id: string): boolean {
  return id.startsWith("new-") || isFallbackId(id);
}

/**
 * Combina filas del CMS con traducciones por defecto: si hay 1 artículo en CMS
 * y 5 en traducciones, se muestran 1 + 4 (no solo el del CMS).
 */
export function resolveArticlesForDisplay(
  cmsItems: CmsArticle[],
  fallbacks: CmsArticle[],
  options?: { includeUnpublished?: boolean }
): CmsArticle[] {
  const cms = sortByOrder(
    options?.includeUnpublished ? cmsItems : cmsItems.filter((a) => a.is_published)
  );
  if (cms.length === 0) return fallbacks;
  return [...cms, ...fallbacks.slice(cms.length)];
}

export function resolveServicesForDisplay(
  cmsItems: CmsService[],
  fallbacks: { name: string; description: string }[],
  options?: { includeUnpublished?: boolean }
): PreviewServiceRow[] {
  const cms = sortByOrder(
    options?.includeUnpublished ? cmsItems : cmsItems.filter((s) => s.is_published)
  );
  const cmsRows: PreviewServiceRow[] = cms.map((s) => ({
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

export function resolvePlansForDisplay(
  cmsItems: CmsPlan[],
  fallbacks: { name: string; items: string[]; is_featured: boolean }[],
  options?: { includeUnpublished?: boolean }
): PreviewPlanRow[] {
  const cms = sortByOrder(
    options?.includeUnpublished ? cmsItems : cmsItems.filter((p) => p.is_published)
  );
  const cmsRows: PreviewPlanRow[] = cms.map((p) => ({
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
