import { createClient } from "@/lib/supabase";
import type { CmsArticle, CmsBundle, CmsPlan, CmsService, Locale } from "@/lib/cms/types";

function parsePlanItems(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((x): x is string => typeof x === "string" && x.trim().length > 0);
}

export async function fetchCmsBundle(locale: Locale, options?: { includeUnpublished?: boolean }): Promise<CmsBundle> {
  const supabase = createClient();
  const includeUnpublished = options?.includeUnpublished ?? false;

  let servicesQuery = supabase
    .from("cms_services")
    .select("id, locale, sort_order, name, description, is_published")
    .eq("locale", locale)
    .order("sort_order", { ascending: true });

  let plansQuery = supabase
    .from("cms_plans")
    .select("id, locale, sort_order, name, items, is_featured, is_published")
    .eq("locale", locale)
    .order("sort_order", { ascending: true });

  let articlesQuery = supabase
    .from("cms_articles")
    .select("id, locale, sort_order, category, title, body, image_url, is_published, published_at")
    .eq("locale", locale)
    .order("sort_order", { ascending: true });

  if (!includeUnpublished) {
    servicesQuery = servicesQuery.eq("is_published", true);
    plansQuery = plansQuery.eq("is_published", true);
    articlesQuery = articlesQuery.eq("is_published", true);
  }

  const [servicesRes, plansRes, articlesRes, textsRes] = await Promise.all([
    servicesQuery,
    plansQuery,
    articlesQuery,
    supabase.from("cms_text_entries").select("content_key, value").eq("locale", locale),
  ]);

  const textOverrides: Record<string, string> = {};
  (textsRes.data ?? []).forEach((row) => {
    if (row.content_key && row.value?.trim()) {
      textOverrides[row.content_key] = row.value;
    }
  });

  const services = ((servicesRes.data ?? []) as CmsService[]).map((s) => ({
    ...s,
    description: s.description ?? "",
  }));

  const plans = ((plansRes.data ?? []) as { items: unknown }[]).map((p) => ({
    ...(p as CmsPlan),
    items: parsePlanItems(p.items),
  }));

  const articles = (articlesRes.data ?? []) as CmsArticle[];

  return { services, plans, articles, textOverrides };
}

export function resolveCmsText(
  overrides: Record<string, string>,
  key: string,
  fallback: string
): string {
  const v = overrides[key];
  return v?.trim() ? v : fallback;
}
