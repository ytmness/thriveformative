import { getPool, query } from "@/lib/db";
import type { StoreReceiptData } from "@/lib/store/orderTypes";

export type PickupLocation = { id: string; name: string; city: string | null };

export type PickupAvailability = {
  locations: PickupLocation[];
  lines: { ref: string; locationIds: string[] }[];
};

type StockRow = { ref: string; location_id: string };
type LocationRow = PickupLocation;

export async function loadPickupAvailability(locale: string, refs: string[]): Promise<PickupAvailability> {
  const unique = [...new Set(refs)];
  const locations = await query<LocationRow>(
    `SELECT id, name, city FROM locations WHERE is_active = true ORDER BY name`
  );
  if (!unique.length) return { locations: locations.rows, lines: [] };
  const stock = await query<StockRow>(
    `SELECT DISTINCT sp.ref, l.id AS location_id
     FROM store_products sp
     JOIN products p ON lower(btrim(p.name)) = lower(btrim(sp.name)) AND p.is_active = true
     JOIN product_stock ps ON ps.product_id = p.id AND ps.quantity > 0
     JOIN locations l ON l.id = ps.location_id AND l.is_active = true
     WHERE sp.locale = $1 AND sp.is_published = true AND sp.ref = ANY($2::text[])`,
    [locale, unique]
  );
  const byRef = new Map<string, string[]>();
  for (const row of stock.rows) {
    const list = byRef.get(row.ref) ?? [];
    list.push(row.location_id);
    byRef.set(row.ref, list);
  }
  return {
    locations: locations.rows,
    lines: unique.map((ref) => ({ ref, locationIds: byRef.get(ref) ?? [] })),
  };
}

export async function assertPickupStock(locale: string, locationId: string, refs: string[]): Promise<string> {
  const availability = await loadPickupAvailability(locale, refs);
  const site = availability.locations.find((row) => row.id === locationId);
  if (!site) throw new Error("La sede no está disponible.");
  const missing = availability.lines.some((line) => !line.locationIds.includes(locationId));
  if (missing) throw new Error("Esa sede no tiene todos los productos para recoger.");
  return site.name;
}

type SavedLine = {
  ref: string;
  name: string;
  variationName: string | null;
  quantity: number;
  unitAmount: number;
  currency: string;
  imageUrl: string | null;
};

export async function insertStoreOrder(input: {
  locale: string;
  fulfillment: "pickup" | "shipping";
  locationId: string | null;
  locationName: string | null;
  recipientName: string;
  addressLine1: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string | null;
  currency: string;
  totalAmount: number;
  squareOrderId: string;
  squarePaymentId: string;
  receiptUrl: string | null;
  lines: SavedLine[];
}): Promise<StoreReceiptData> {
  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const inserted = await client.query<{ id: string; public_token: string; created_at: Date }>(
      `INSERT INTO store_orders (
         locale, fulfillment, location_id, recipient_name, address_line1, city, state, postal_code, country,
         currency, total_amount, square_order_id, square_payment_id, receipt_url
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
       RETURNING id, public_token, created_at`,
      [
        input.locale,
        input.fulfillment,
        input.locationId,
        input.recipientName,
        input.addressLine1,
        input.city,
        input.state,
        input.postalCode,
        input.country,
        input.currency,
        input.totalAmount,
        input.squareOrderId,
        input.squarePaymentId,
        input.receiptUrl,
      ]
    );
    const order = inserted.rows[0];
    for (const line of input.lines) {
      await client.query(
        `INSERT INTO store_order_lines (order_id, ref, name, variation_name, quantity, unit_amount, currency, image_url)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [order.id, line.ref, line.name, line.variationName, line.quantity, line.unitAmount, line.currency, line.imageUrl]
      );
    }
    await client.query("COMMIT");
    const address = [input.addressLine1, input.city, input.state, input.postalCode, input.country].filter(Boolean).join(", ");
    return {
      folio: order.public_token.slice(0, 8).toUpperCase(),
      paidAt: order.created_at.toISOString(),
      recipientName: input.recipientName,
      fulfillment: input.fulfillment,
      locationName: input.locationName,
      address: address || null,
      currency: input.currency,
      totalAmount: input.totalAmount,
      lines: input.lines.map((line) => ({
        name: line.name,
        variationName: line.variationName,
        quantity: line.quantity,
        unitAmount: line.unitAmount,
        currency: line.currency,
      })),
      locale: input.locale,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export type StoreOrderListRow = {
  id: string;
  status: string;
  fulfillment: string;
  recipient_name: string;
  currency: string;
  total_amount: number;
  location_name: string | null;
  city: string | null;
  created_at: string;
};

export async function listStoreOrders(): Promise<StoreOrderListRow[]> {
  const result = await query<StoreOrderListRow>(
    `SELECT o.id, o.status, o.fulfillment, o.recipient_name, o.currency, o.total_amount,
            l.name AS location_name, o.city, o.created_at
     FROM store_orders o
     LEFT JOIN locations l ON l.id = o.location_id
     ORDER BY o.created_at DESC
     LIMIT 100`
  );
  return result.rows;
}

export type StoreOrderDetail = StoreReceiptData & {
  id: string;
  status: string;
  receiptUrl: string | null;
};

export async function getStoreOrder(id: string): Promise<StoreOrderDetail | null> {
  const result = await query<{
    id: string;
    public_token: string;
    status: string;
    fulfillment: "pickup" | "shipping";
    recipient_name: string;
    address_line1: string | null;
    city: string | null;
    state: string | null;
    postal_code: string | null;
    country: string | null;
    currency: string;
    total_amount: number;
    receipt_url: string | null;
    created_at: Date;
    locale: string;
    location_name: string | null;
  }>(
    `SELECT o.id, o.public_token, o.status, o.fulfillment, o.recipient_name, o.address_line1, o.city, o.state,
            o.postal_code, o.country, o.currency, o.total_amount, o.receipt_url, o.created_at, o.locale,
            l.name AS location_name
     FROM store_orders o
     LEFT JOIN locations l ON l.id = o.location_id
     WHERE o.id = $1`,
    [id]
  );
  const order = result.rows[0];
  if (!order) return null;
  const lines = await query<{
    name: string;
    variation_name: string | null;
    quantity: number;
    unit_amount: number;
    currency: string;
  }>(
    `SELECT name, variation_name, quantity, unit_amount, currency
     FROM store_order_lines WHERE order_id = $1 ORDER BY name`,
    [id]
  );
  const address = [order.address_line1, order.city, order.state, order.postal_code, order.country].filter(Boolean).join(", ");
  return {
    id: order.id,
    status: order.status,
    receiptUrl: order.receipt_url,
    folio: order.public_token.slice(0, 8).toUpperCase(),
    paidAt: order.created_at.toISOString(),
    recipientName: order.recipient_name,
    fulfillment: order.fulfillment,
    locationName: order.location_name,
    address: address || null,
    currency: order.currency,
    totalAmount: order.total_amount,
    lines: lines.rows.map((line) => ({
      name: line.name,
      variationName: line.variation_name,
      quantity: line.quantity,
      unitAmount: line.unit_amount,
      currency: line.currency,
    })),
    locale: order.locale,
  };
}

export async function updateStoreOrderStatus(id: string, status: "paid" | "ready" | "completed" | "cancelled"): Promise<boolean> {
  const result = await query(
    `UPDATE store_orders SET status = $2, updated_at = now() WHERE id = $1`,
    [id, status]
  );
  return (result.rowCount ?? 0) > 0;
}
