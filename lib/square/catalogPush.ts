import { randomUUID } from "crypto";
import { query } from "@/lib/db";
import { squareFetch } from "@/lib/square/client";
import { setSquareVariationCount, squareVariationHasCount } from "@/lib/square/inventory";
import { majorToMinor } from "@/lib/square/money";
import { ensureStoreProductInPos } from "@/lib/store/posCatalog";
import { sellsOnSite } from "@/lib/store/sellsHere";
import { sellableVariations } from "@/lib/store/variations";

type CatalogVariation = {
  id?: string;
  version?: number;
  item_variation_data?: { name?: string };
};

type CatalogItem = {
  id?: string;
  version?: number;
  item_data?: { variations?: CatalogVariation[] };
};

type StoreRow = {
  id: string;
  country: string;
  ref: string;
  name: string;
  description: string | null;
  referral_url: string | null;
  image_url: string | null;
  currency: string | null;
  source: string | null;
  source_handle: string | null;
  source_payload: unknown;
  price_min: number | null;
  is_published: boolean;
  category_name: string | null;
};

export async function pushUsStoreProduct(productId: string): Promise<void> {
  const found = await query<StoreRow>(
    `SELECT p.id, p.country, p.ref, p.name, p.description, p.referral_url, p.image_url, p.currency,
            p.source, p.source_handle, p.source_payload, p.price_min, p.is_published, c.name AS category_name
     FROM store_products p
     LEFT JOIN store_categories c ON c.id = p.category_id
     WHERE p.id = $1`,
    [productId]
  );
  const row = found.rows[0];
  if (!row || row.country !== "US") return;
  if (!sellsOnSite(row) || !row.is_published) {
    await retireSquareItem(row);
    return;
  }
  const existing = await loadSquareItem(row.source === "square" ? row.source_handle : null);
  const price = majorToMinor(Number(row.price_min), "USD");
  const previousVariations = existing?.item_data?.variations ?? [];
  const variations = previousVariations.length
    ? previousVariations.map((variation, index) => ({
        type: "ITEM_VARIATION",
        id: variation.id,
        version: variation.version,
        item_variation_data: {
          item_id: existing?.id,
          name: variation.item_variation_data?.name || "Estándar",
          pricing_type: "FIXED_PRICING",
          price_money: {
            amount: previousVariations.length === 1 ? price : variationPrice(row, index, price),
            currency: "USD",
          },
          track_inventory: true,
          sellable: true,
          stockable: true,
        },
      }))
    : [
        {
          type: "ITEM_VARIATION",
          id: "#var",
          item_variation_data: {
            item_id: "#item",
            name: "Estándar",
            pricing_type: "FIXED_PRICING",
            price_money: { amount: price, currency: "USD" },
            track_inventory: true,
            sellable: true,
            stockable: true,
          },
        },
      ];

  const saved = await squareFetch<{ catalog_object?: CatalogItem }>("/v2/catalog/object", {
    method: "POST",
    body: {
      idempotency_key: randomUUID(),
      object: {
        type: "ITEM",
        id: existing?.id || "#item",
        version: existing?.version,
        present_at_all_locations: true,
        item_data: {
          name: row.name.slice(0, 512),
          description: (row.description || "").slice(0, 4096),
          variations,
        },
      },
    },
  });
  const item = saved.catalog_object;
  const itemId = item?.id;
  if (!itemId) throw new Error("Square no devolvió el producto.");
  const payloadVariations = (item?.item_data?.variations ?? []).map((variation, index) => ({
    id: variation.id,
    name: variation.item_variation_data?.name || "Estándar",
    amount: previousVariations.length === 1 ? price : variationPrice(row, index, price),
    currency: "USD",
  }));
  const payload = { item_id: itemId, variations: payloadVariations };
  await query(
    `UPDATE store_products
     SET source = 'square', source_handle = $2, source_payload = $3::jsonb, currency = 'USD', updated_at = now()
     WHERE country = 'US' AND ref = $1 AND coalesce(referral_url, '') = '' AND price_min IS NOT NULL`,
    [row.ref, itemId, JSON.stringify(payload)]
  );
  await ensureStoreProductInPos(row.ref);
  const created = !existing?.id;
  const variationId = payloadVariations[0]?.id;
  if (created && variationId && !(await squareVariationHasCount(variationId).catch(() => true))) {
    const stock = await query<{ qty: string }>(
      `SELECT coalesce(sum(ps.quantity), 0)::text AS qty
       FROM products p
       JOIN product_stock ps ON ps.product_id = p.id
       JOIN locations l ON l.id = ps.location_id
       WHERE p.sku = $1
         AND upper(l.country) IN ('US', 'USA', 'UNITED STATES', 'ESTADOS UNIDOS')`,
      [`tienda:US:${row.ref}:${variationId.replace(/[^A-Za-z0-9_-]/g, "").slice(0, 48)}`]
    );
    await setSquareVariationCount(variationId, Number(stock.rows[0]?.qty || 0)).catch(() => undefined);
  }
}

function variationPrice(row: StoreRow, index: number, fallback: number) {
  const current = sellableVariations({
    source: row.source,
    sourcePayload: row.source_payload,
    priceMin: row.price_min,
    currency: "USD",
  });
  return current[index]?.amount || fallback;
}

async function loadSquareItem(id: string | null): Promise<CatalogItem | null> {
  if (!id) return null;
  const body = await squareFetch<{ object?: CatalogItem }>(`/v2/catalog/object/${encodeURIComponent(id)}`);
  return body.object ?? null;
}

async function retireSquareItem(row: StoreRow) {
  if (row.source !== "square" || !row.source_handle) return;
  const siblings = await query<{ n: number }>(
    `SELECT count(*)::int AS n FROM store_products
     WHERE country = 'US' AND ref = $1 AND id <> $2 AND coalesce(referral_url, '') = '' AND price_min > 0 AND is_published`,
    [row.ref, row.id]
  );
  if ((siblings.rows[0]?.n || 0) > 0) return;
  await squareFetch(`/v2/catalog/object/${encodeURIComponent(row.source_handle)}`, { method: "DELETE" }).catch(() => undefined);
  await query(
    `UPDATE store_products SET source = NULL, source_handle = NULL, source_payload = NULL WHERE country = 'US' AND ref = $1`,
    [row.ref]
  );
}
