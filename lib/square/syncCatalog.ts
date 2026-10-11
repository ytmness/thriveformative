import { CMS_LOCALES } from "@/lib/cms/types";
import { query } from "@/lib/db";
import { normalizeCountry } from "@/lib/domain/scope";
import { getSiteUrl } from "@/lib/env/server";
import { fetchSquareCatalog, squareProductRef, type SquareCatalogItem } from "@/lib/square/catalog";
import { slugifyRef } from "@/lib/store/slug";

type ExistingProduct = {
  locale: string;
  country: string;
  ref: string;
  source: string | null;
  source_handle: string | null;
};

type ExistingCategory = {
  id: string;
  locale: string;
  country: string;
  slug: string;
  sort_order: number;
};

export type SquareSyncResult = {
  environment: string;
  country: string;
  products: number;
  rows: number;
};

export async function syncSquareCatalog(environment: string, countryInput?: string | null): Promise<SquareSyncResult> {
  const country = normalizeCountry(countryInput) || "MX";
  const items = await fetchSquareCatalog();
  const siteUrl = getSiteUrl().replace(/\/$/, "");

  const [productRes, categoryRes] = await Promise.all([
    query<ExistingProduct>(
      `SELECT locale, country, ref, source, source_handle FROM store_products`
    ),
    query<ExistingCategory>(
      `SELECT id, locale, country, slug, sort_order FROM store_categories WHERE country = $1`,
      [country]
    ),
  ]);

  const products = productRes.rows;
  const categories = categoryRes.rows;
  const usedRefs = new Map<string, Set<string>>();
  for (const locale of CMS_LOCALES) {
    usedRefs.set(
      locale,
      new Set(products.filter((row) => row.locale === locale).map((row) => row.ref))
    );
  }

  let rows = 0;
  for (const item of items) {
    const preferred =
      products.find((row) => row.country === country && row.source === "square" && row.source_handle === item.itemId)
        ?.ref ?? slugifyRef(item.name);

    for (const locale of CMS_LOCALES) {
      const localeRef = refForLocale(products, usedRefs, locale, country, item.itemId, preferred || item.itemId);
      const categoryId = await ensureCategory(categories, locale, country, item.categoryName);
      await upsertProduct(products, {
        locale,
        country,
        ref: localeRef,
        item,
        categoryId,
        referralUrl: `${siteUrl}/${locale}/tienda/${localeRef}`,
      });
      rows += 1;
    }
  }

  return { environment, country, products: items.length, rows };
}

function refForLocale(
  products: ExistingProduct[],
  usedRefs: Map<string, Set<string>>,
  locale: string,
  country: string,
  itemId: string,
  preferred: string
): string {
  const previous = products.find(
    (row) =>
      row.locale === locale &&
      row.country === country &&
      row.source === "square" &&
      row.source_handle === itemId
  );
  if (previous?.ref) return previous.ref;

  const used = usedRefs.get(locale) ?? new Set<string>();
  const ref = squareProductRef(slugifyRef(preferred) || itemId, itemId, used);
  usedRefs.set(locale, used);
  return ref;
}

async function ensureCategory(
  categories: ExistingCategory[],
  locale: string,
  country: string,
  name: string
): Promise<string> {
  const slug = slugifyRef(name) || "square";
  const found = categories.find((row) => row.locale === locale && row.country === country && row.slug === slug);
  if (found) return found.id;

  const sortOrder =
    categories
      .filter((row) => row.locale === locale && row.country === country)
      .reduce((max, row) => Math.max(max, row.sort_order), 0) + 1;

  const inserted = await query<ExistingCategory>(
    `INSERT INTO store_categories (locale, country, name, slug, sort_order)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, locale, country, slug, sort_order`,
    [locale, country, name, slug, sortOrder]
  );
  const row = inserted.rows[0];
  if (!row) throw new Error("No se pudo crear la categoría de Square.");
  categories.push(row);
  return row.id;
}

async function upsertProduct(
  existing: ExistingProduct[],
  input: {
    locale: string;
    country: string;
    ref: string;
    item: SquareCatalogItem;
    categoryId: string;
    referralUrl: string;
  }
) {
  const payload = {
    item_id: input.item.itemId,
    variations: input.item.variations,
  };
  const previous = existing.find(
    (row) =>
      row.locale === input.locale &&
      row.country === input.country &&
      row.source === "square" &&
      row.source_handle === input.item.itemId
  );

  if (previous) {
    await query(
      `UPDATE store_products SET
         name = $1, description = $2, referral_url = $3, image_url = $4, category_id = $5,
         price_min = $6, price_max = $7, currency = $8, source = 'square', source_handle = $9,
         source_payload = $10::jsonb,
         image_urls = CASE
           WHEN cardinality(image_urls) > 1 THEN image_urls
           WHEN $4 IS NULL OR btrim($4) = '' THEN '{}'::text[]
           ELSE ARRAY[$4]::text[]
         END,
         updated_at = now()
       WHERE locale = $11 AND country = $12 AND source = 'square' AND source_handle = $13`,
      [
        input.item.name,
        input.item.description,
        input.referralUrl,
        input.item.imageUrl,
        input.categoryId,
        input.item.priceMin,
        input.item.priceMax,
        input.item.currency,
        input.item.itemId,
        JSON.stringify(payload),
        input.locale,
        input.country,
        input.item.itemId,
      ]
    );
    return;
  }

  const sortOrder = existing.filter((row) => row.locale === input.locale && row.country === input.country).length + 1;
  await query(
    `INSERT INTO store_products
       (locale, country, sort_order, name, description, ref, referral_url, image_url, category_id,
        is_published, price_min, price_max, currency, source, source_handle, source_payload)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,true,$10,$11,$12,'square',$13,$14::jsonb)`,
    [
      input.locale,
      input.country,
      sortOrder,
      input.item.name,
      input.item.description,
      input.ref,
      input.referralUrl,
      input.item.imageUrl,
      input.categoryId,
      input.item.priceMin,
      input.item.priceMax,
      input.item.currency,
      input.item.itemId,
      JSON.stringify(payload),
    ]
  );
  existing.push({
    locale: input.locale,
    country: input.country,
    ref: input.ref,
    source: "square",
    source_handle: input.item.itemId,
  });
}
