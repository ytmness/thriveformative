import { createHash } from "crypto";
import { query } from "@/lib/db";
import { locationCountrySql } from "@/lib/domain/scope";
import { log } from "@/lib/log";
import { sellSquareVariation } from "@/lib/square/inventory";
import { posSku } from "@/lib/store/variations";

async function posProductId(ref: string, variationId: string, name: string) {
  const sku = posSku("US", ref, variationId);
  const found = await query<{ id: string }>(
    `SELECT id FROM products WHERE sku = $1 OR lower(name) = lower($2) ORDER BY (sku = $1) DESC LIMIT 1`,
    [sku, name]
  );
  return found.rows[0]?.id ?? null;
}

async function deductAt(productId: string, locationId: string, quantity: number, reason: string) {
  const seen = await query(`SELECT 1 FROM stock_movements WHERE reason = $1 LIMIT 1`, [reason]);
  if (seen.rows[0]) return true;
  const updated = await query(
    `UPDATE product_stock SET quantity = quantity - $3
     WHERE product_id = $1 AND location_id = $2 AND quantity >= $3`,
    [productId, locationId, quantity]
  );
  if ((updated.rowCount ?? 0) !== 1) return false;
  await query(
    `INSERT INTO stock_movements (product_id, location_id, movement_type, quantity, reason)
     VALUES ($1,$2,'sale',$3,$4)`,
    [productId, locationId, -quantity, reason]
  );
  return true;
}

async function usLocationWithStock(productId: string, quantity: number) {
  const found = await query<{ location_id: string }>(
    `SELECT ps.location_id
     FROM product_stock ps
     JOIN locations l ON l.id = ps.location_id
     WHERE ps.product_id = $1 AND ps.quantity >= $2 AND ${locationCountrySql("l.country", "$3")}
     ORDER BY ps.quantity DESC
     LIMIT 1`,
    [productId, quantity, "US"]
  );
  return found.rows[0]?.location_id ?? null;
}

export async function deductUsOnlineSale(input: {
  lines: { ref: string; variationId: string; quantity: number; name: string }[];
  locationId: string | null;
  reason: string;
}) {
  for (const line of input.lines) {
    const productId = await posProductId(line.ref, line.variationId, line.name);
    if (!productId) continue;
    const locationId = input.locationId || (await usLocationWithStock(productId, line.quantity));
    if (!locationId) {
      log.warn("inventory", "sin stock en Estados Unidos para descontar la venta en línea");
      continue;
    }
    const ok = await deductAt(productId, locationId, line.quantity, `${input.reason}:${line.ref}`);
    if (!ok) log.warn("inventory", "no alcanzó el stock de la sede para la venta en línea");
  }
}

export async function deductThriveForSquareVariation(variationId: string, quantity: number, reason: string) {
  const linked = await query<{ ref: string; name: string }>(
    `SELECT ref, name FROM store_products
     WHERE country = 'US' AND source = 'square'
       AND EXISTS (
         SELECT 1 FROM jsonb_array_elements(COALESCE(source_payload->'variations', '[]'::jsonb)) variation
         WHERE variation->>'id' = $1
       )
     LIMIT 1`,
    [variationId]
  );
  const row = linked.rows[0];
  if (!row) return;
  const productId = await posProductId(row.ref, variationId, row.name);
  if (!productId) return;
  const locationId = await usLocationWithStock(productId, quantity);
  if (!locationId) {
    log.warn("inventory", "Square vendió un producto sin stock en las sedes de Estados Unidos");
    return;
  }
  await deductAt(productId, locationId, quantity, reason);
}

export async function mirrorClinicSaleToSquare(saleId: string) {
  const items = await query<{ reference_id: string; quantity: string; country: string | null; sku: string | null; name: string }>(
    `SELECT si.reference_id, si.quantity::text, l.country, p.sku, p.name
     FROM sale_items si
     JOIN sales s ON s.id = si.sale_id
     LEFT JOIN locations l ON l.id = s.location_id
     LEFT JOIN products p ON p.id = si.reference_id
     WHERE si.sale_id = $1 AND si.item_type = 'product' AND si.reference_id IS NOT NULL`,
    [saleId]
  );
  for (const item of items.rows) {
    const country = (item.country || "").toUpperCase();
    if (!["US", "USA", "UNITED STATES", "ESTADOS UNIDOS"].includes(country)) continue;
    const variationId = await squareVariationForProduct(item.sku, item.name);
    if (!variationId) continue;
    const key = createHash("sha256").update(`${saleId}:${item.reference_id}`).digest("hex").slice(0, 32);
    await sellSquareVariation(variationId, Number(item.quantity) || 1, key).catch(() => {
      log.warn("inventory", "Square no descontó el stock de la venta de mostrador");
    });
  }
}

async function squareVariationForProduct(sku: string | null, name: string) {
  if (sku?.startsWith("tienda:US:")) {
    const parts = sku.split(":");
    const variationKey = parts[3] || "";
    const ref = parts[2] || "";
    if (variationKey && variationKey !== "default") {
      const match = await query<{ id: string }>(
        `SELECT variation->>'id' AS id
         FROM store_products, jsonb_array_elements(COALESCE(source_payload->'variations', '[]'::jsonb)) variation
         WHERE country = 'US' AND ref = $1
           AND regexp_replace(variation->>'id', '[^A-Za-z0-9_-]', '', 'g') = $2
         LIMIT 1`,
        [ref, `${variationKey}%`]
      );
      if (match.rows[0]?.id) return match.rows[0].id;
    }
  }
  const byName = await query<{ id: string }>(
    `SELECT variation->>'id' AS id
     FROM store_products, jsonb_array_elements(COALESCE(source_payload->'variations', '[]'::jsonb)) variation
     WHERE country = 'US' AND source = 'square' AND lower(name) = lower($1)
     LIMIT 1`,
    [name]
  );
  return byName.rows[0]?.id ?? null;
}
