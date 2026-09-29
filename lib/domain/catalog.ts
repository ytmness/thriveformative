import ExcelJS from "exceljs";
import { query } from "@/lib/db";
import { withTx } from "@/lib/dbTx";
import { DomainError } from "@/lib/http";
import type { StaffSession } from "@/lib/auth/session";
import { writeAudit } from "@/lib/audit";

export async function listProducts() {
  const rows = await query(
    `SELECT p.*, c.name AS category_name, s.name AS supplier_name, t.name AS tax_name, t.rate AS tax_rate
     FROM products p
     LEFT JOIN product_categories c ON c.id = p.category_id
     LEFT JOIN suppliers s ON s.id = p.supplier_id
     LEFT JOIN taxes t ON t.id = p.tax_id
     ORDER BY p.name`
  );
  const stock = await query(
    `SELECT ps.*, l.name AS location_name FROM product_stock ps JOIN locations l ON l.id = ps.location_id`
  );
  return rows.rows.map((product) => ({
    ...product,
    stock: stock.rows.filter((row) => row.product_id === product.id),
    lowStock: stock.rows.some((row) => row.product_id === product.id && Number(row.quantity) <= Number(row.min_stock)),
  }));
}

export async function saveProduct(id: string | null, body: Record<string, unknown>) {
  const name = String(body.name || "").trim();
  if (!name) throw new DomainError("El nombre es obligatorio.");
  const values = [
    body.categoryId || null,
    body.supplierId || null,
    name,
    body.barcode || null,
    body.sku || null,
    body.sizeLabel || null,
    body.description || "",
    body.imageUrl || null,
    body.cost ?? 0,
    body.price ?? 0,
    body.taxId || null,
    body.isActive !== false,
  ];
  if (!id) {
    const inserted = await query<{ id: string }>(
      `INSERT INTO products (category_id, supplier_id, name, barcode, sku, size_label, description, image_url, cost, price, tax_id, is_active)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING id`,
      values
    );
    return { id: inserted.rows[0].id };
  }
  await query(
    `UPDATE products SET category_id=$2, supplier_id=$3, name=$4, barcode=$5, sku=$6, size_label=$7, description=$8,
      image_url=$9, cost=$10, price=$11, tax_id=$12, is_active=$13 WHERE id=$1`,
    [id, ...values]
  );
  return { id };
}

export async function adjustStock(body: Record<string, unknown>, actor: StaffSession) {
  const productId = String(body.productId || "");
  const locationId = String(body.locationId || "");
  const quantity = Number(body.quantity);
  const movement = String(body.movementType || "adjust");
  if (!productId || !locationId || !Number.isFinite(quantity) || quantity === 0) {
    throw new DomainError("Producto, sede y cantidad son obligatorios.");
  }
  if (!["adjust", "purchase", "waste", "transfer"].includes(movement)) throw new DomainError("Tipo de movimiento no válido.");
  await withTx(async (q) => {
    await q(
      `INSERT INTO product_stock (product_id, location_id, quantity, min_stock, max_stock)
       VALUES ($1,$2,0,$3,$4)
       ON CONFLICT (product_id, location_id) DO UPDATE SET min_stock = COALESCE($3, product_stock.min_stock), max_stock = COALESCE($4, product_stock.max_stock)`,
      [productId, locationId, body.minStock ?? null, body.maxStock ?? null]
    );
    const updated = await q(
      `UPDATE product_stock SET quantity = quantity + $3 WHERE product_id = $1 AND location_id = $2 AND quantity + $3 >= 0`,
      [productId, locationId, quantity]
    );
    if (updated.rowCount !== 1) throw new DomainError("El ajuste dejaría el stock en negativo.");
    await q(
      `INSERT INTO stock_movements (product_id, location_id, movement_type, quantity, reason, staff_user_id)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [productId, locationId, movement, quantity, body.reason || null, actor.staff.id]
    );
  });
  await writeAudit({ actorType: "staff", actorId: actor.staff.id, action: "inventory.adjust", entityType: "product", entityId: productId });
}

export async function exportInventory(format: string) {
  const rows = await query(
    `SELECT p.name, p.sku, p.barcode, p.size_label, p.cost, p.price, c.name AS category,
            l.name AS location, coalesce(ps.quantity,0) AS quantity, coalesce(ps.min_stock,0) AS min_stock, ps.max_stock
     FROM products p
     LEFT JOIN product_categories c ON c.id = p.category_id
     LEFT JOIN product_stock ps ON ps.product_id = p.id
     LEFT JOIN locations l ON l.id = ps.location_id
     ORDER BY p.name, l.name`
  );
  const header = ["nombre", "sku", "codigo_barras", "tamano", "costo", "precio", "categoria", "sede", "stock", "minimo", "maximo"];
  if (format === "xlsx") {
    const book = new ExcelJS.Workbook();
    const sheet = book.addWorksheet("Inventario");
    sheet.addRow(header);
    for (const row of rows.rows) {
      sheet.addRow([
        row.name, row.sku, row.barcode, row.size_label, Number(row.cost), Number(row.price),
        row.category, row.location, Number(row.quantity), Number(row.min_stock), row.max_stock == null ? null : Number(row.max_stock),
      ]);
    }
    const buffer = await book.xlsx.writeBuffer();
    return { contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", filename: "inventario.xlsx", body: Buffer.from(buffer) };
  }
  const lines = [header.join(",")];
  for (const row of rows.rows) {
    lines.push(
      [row.name, row.sku, row.barcode, row.size_label, row.cost, row.price, row.category, row.location, row.quantity, row.min_stock, row.max_stock]
        .map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`)
        .join(",")
    );
  }
  return { contentType: "text/csv; charset=utf-8", filename: "inventario.csv", body: Buffer.from(lines.join("\n"), "utf8") };
}

export async function saveSimple(table: "packages" | "memberships", id: string | null, body: Record<string, unknown>) {
  const name = String(body.name || "").trim();
  if (!name) throw new DomainError("El nombre es obligatorio.");
  if (table === "packages") {
    if (!id) {
      const inserted = await query<{ id: string }>(
        `INSERT INTO packages (name, price, description, is_active) VALUES ($1,$2,$3,$4) RETURNING id`,
        [name, body.price ?? 0, body.description || "", body.isActive !== false]
      );
      if (Array.isArray(body.items)) {
        for (const item of body.items as { serviceId?: string; productId?: string; quantity?: number }[]) {
          await query(`INSERT INTO package_items (package_id, service_id, product_id, quantity) VALUES ($1,$2,$3,$4)`, [
            inserted.rows[0].id, item.serviceId || null, item.productId || null, item.quantity || 1,
          ]);
        }
      }
      return { id: inserted.rows[0].id };
    }
    await query(`UPDATE packages SET name=$2, price=$3, description=$4, is_active=$5 WHERE id=$1`, [
      id, name, body.price ?? 0, body.description || "", body.isActive !== false,
    ]);
    return { id };
  }
  if (!id) {
    const inserted = await query<{ id: string }>(
      `INSERT INTO memberships (name, price, interval_unit, description, is_active) VALUES ($1,$2,$3,$4,$5) RETURNING id`,
      [name, body.price ?? 0, body.intervalUnit === "year" ? "year" : "month", body.description || "", body.isActive !== false]
    );
    return { id: inserted.rows[0].id };
  }
  await query(`UPDATE memberships SET name=$2, price=$3, interval_unit=$4, description=$5, is_active=$6 WHERE id=$1`, [
    id, name, body.price ?? 0, body.intervalUnit === "year" ? "year" : "month", body.description || "", body.isActive !== false,
  ]);
  return { id };
}
