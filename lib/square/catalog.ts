import { squareFetch } from "@/lib/square/client";
import { minorToMajor, readSquareMoney } from "@/lib/square/money";
import { slugifyRef } from "@/lib/store/slug";

export type SquareVariation = {
  id: string;
  name: string;
  amount: number;
  currency: string;
};

export type SquareCatalogItem = {
  itemId: string;
  name: string;
  description: string;
  imageUrl: string | null;
  categoryName: string;
  variations: SquareVariation[];
  priceMin: number;
  priceMax: number;
  currency: string;
};

type CatalogObject = {
  type?: string;
  id?: string;
  is_deleted?: boolean;
  item_data?: {
    name?: string;
    description?: string;
    description_plaintext?: string;
    category_id?: string;
    categories?: { id?: string }[];
    image_ids?: string[];
    variations?: CatalogObject[];
  };
  item_variation_data?: {
    name?: string;
    pricing_type?: string;
    price_money?: { amount?: number | string; currency?: string };
  };
  category_data?: { name?: string };
  image_data?: { url?: string };
};

type SearchResponse = {
  objects?: CatalogObject[];
  related_objects?: CatalogObject[];
  cursor?: string;
};

function stripText(value: string): string {
  return value
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, 4000);
}

function httpsUrl(value: string | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function variationsOf(item: CatalogObject): SquareVariation[] {
  const rows = item.item_data?.variations ?? [];
  const variations: SquareVariation[] = [];
  for (const row of rows) {
    if (row.is_deleted || !row.id) continue;
    const data = row.item_variation_data;
    if (data?.pricing_type && data.pricing_type !== "FIXED_PRICING") continue;
    const money = readSquareMoney(data?.price_money);
    if (!money) continue;
    variations.push({
      id: row.id,
      name: data?.name?.trim() || "Estándar",
      amount: money.amount,
      currency: money.currency,
    });
  }
  return variations;
}

export function mapSquareItems(
  objects: CatalogObject[],
  related: CatalogObject[]
): SquareCatalogItem[] {
  const categories = new Map<string, string>();
  const images = new Map<string, string>();
  for (const row of related) {
    if (!row.id) continue;
    if (row.type === "CATEGORY" && row.category_data?.name) {
      categories.set(row.id, row.category_data.name.trim());
    }
    if (row.type === "IMAGE") {
      const url = httpsUrl(row.image_data?.url);
      if (url) images.set(row.id, url);
    }
  }

  const items: SquareCatalogItem[] = [];
  for (const object of objects) {
    if (object.type !== "ITEM" || object.is_deleted || !object.id) continue;
    const variations = variationsOf(object);
    if (!variations.length) continue;

    const categoryId =
      object.item_data?.categories?.find((entry) => entry.id)?.id ||
      object.item_data?.category_id;
    const imageId = object.item_data?.image_ids?.[0];
    const majors = variations.map((variation) => minorToMajor(variation.amount, variation.currency));

    items.push({
      itemId: object.id,
      name: object.item_data?.name?.trim() || "Producto",
      description: stripText(
        object.item_data?.description_plaintext || object.item_data?.description || ""
      ),
      imageUrl: imageId ? images.get(imageId) ?? null : null,
      categoryName: (categoryId && categories.get(categoryId)) || "Square",
      variations,
      priceMin: Math.min(...majors),
      priceMax: Math.max(...majors),
      currency: variations[0].currency,
    });
  }
  return items;
}

export async function fetchSquareCatalog(): Promise<SquareCatalogItem[]> {
  const objects: CatalogObject[] = [];
  const related: CatalogObject[] = [];
  let cursor: string | undefined;

  do {
    const page: SearchResponse = await squareFetch<SearchResponse>("/v2/catalog/search", {
      method: "POST",
      body: {
        object_types: ["ITEM"],
        include_deleted_objects: false,
        include_related_objects: true,
        limit: 100,
        cursor,
      },
    });
    objects.push(...(page.objects ?? []));
    related.push(...(page.related_objects ?? []));
    cursor = page.cursor;
  } while (cursor && objects.length < 500);

  return mapSquareItems(objects, related);
}

export function squareProductRef(name: string, itemId: string, used: Set<string>): string {
  let ref = slugifyRef(name);
  if (ref.length < 2) {
    ref = `sq-${itemId.replace(/[^a-z0-9]/gi, "").slice(-8).toLowerCase()}`;
  }
  if (!used.has(ref)) {
    used.add(ref);
    return ref;
  }
  const suffix = itemId.replace(/[^a-z0-9]/gi, "").slice(-6).toLowerCase() || "item";
  const candidate = slugifyRef(`${ref}-${suffix}`).slice(0, 80);
  const unique = candidate.length >= 2 ? candidate : `sq-${suffix}`;
  used.add(unique);
  return unique;
}
