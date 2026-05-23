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

/** Siguiente orden al añadir fila nueva (después de lo que ya se muestra en pantalla). */
export function nextSortOrderFromDisplay(items: { sort_order: number }[]): number {
  if (!items.length) return 0;
  return Math.max(...items.map((i) => i.sort_order)) + 1;
}

/**
 * CMS + traducciones por hueco de sort_order (no por cantidad).
 * Si hay CMS en orden 0 y 5, se mantienen los fallback 1–4 y no se sustituye el 2.
 */
function mergeBySortOrderSlot<T extends { sort_order: number }>(
  cmsItems: T[],
  fallbacks: T[]
): T[] {
  if (cmsItems.length === 0) return fallbacks;
  const cmsOrders = new Set(cmsItems.map((c) => c.sort_order));
  const remaining = fallbacks.filter((f) => !cmsOrders.has(f.sort_order));
  return sortByOrder([...cmsItems, ...remaining]);
}

export function resolveArticlesForDisplay(
  cmsItems: CmsArticle[],
  fallbacks: CmsArticle[],
  options?: { includeUnpublished?: boolean }
): CmsArticle[] {
  const cms = sortByOrder(
    options?.includeUnpublished ? cmsItems : cmsItems.filter((a) => a.is_published)
  );
  return mergeBySortOrderSlot(cms, fallbacks);
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

  const fallbackRows: PreviewServiceRow[] = fallbacks.map((fb, i) => ({
    id: `fallback-service-${i}`,
    name: fb.name,
    desc: fb.description,
    unpublished: false,
    isFallback: true,
    sort_order: i,
  }));

  return mergeBySortOrderSlot(cmsRows, fallbackRows);
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

  const fallbackRows: PreviewPlanRow[] = fallbacks.map((fb, i) => ({
    id: `fallback-plan-${i}`,
    name: fb.name,
    items: fb.items,
    featured: fb.is_featured,
    unpublished: false,
    isFallback: true,
    sort_order: i,
  }));

  return mergeBySortOrderSlot(cmsRows, fallbackRows);
}
