import { query } from "@/lib/db";
import type { CmsArticle, CmsBundle, CmsPlan, CmsService, Locale } from "@/lib/cms/types";

function parsePlanItems(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((x): x is string => typeof x === "string" && x.trim().length > 0);
}

export async function fetchCmsBundleFromDb(
  locale: Locale,
  options?: { includeUnpublished?: boolean }
): Promise<CmsBundle> {
  const includeUnpublished = options?.includeUnpublished ?? false;
  const pubClause = includeUnpublished ? "" : "AND is_published = true";

  const [servicesRes, plansRes, articlesRes, textsRes] = await Promise.all([
    query<CmsService>(
      `SELECT id, locale, sort_order, name, description, is_published
       FROM cms_services WHERE locale = $1 ${pubClause}
       ORDER BY sort_order ASC`,
      [locale]
    ),
    query<{ items: unknown } & CmsPlan>(
      `SELECT id, locale, sort_order, name, items, is_featured, is_published
       FROM cms_plans WHERE locale = $1 ${pubClause}
       ORDER BY sort_order ASC`,
      [locale]
    ),
    query<CmsArticle>(
      `SELECT id, locale, sort_order, category, title, body, image_url, is_published, published_at
       FROM cms_articles WHERE locale = $1 ${pubClause}
       ORDER BY sort_order ASC`,
      [locale]
    ),
    query<{ content_key: string; value: string }>(
      `SELECT content_key, value FROM cms_text_entries WHERE locale = $1`,
      [locale]
    ),
  ]);

  const textOverrides: Record<string, string> = {};
  for (const row of textsRes.rows) {
    if (row.content_key && row.value?.trim()) {
      textOverrides[row.content_key] = row.value;
    }
  }

  return {
    services: servicesRes.rows.map((s) => ({
      ...s,
      description: s.description ?? "",
    })),
    plans: plansRes.rows.map((p) => ({
      ...p,
      items: parsePlanItems(p.items),
    })),
    articles: articlesRes.rows,
    textOverrides,
  };
}
