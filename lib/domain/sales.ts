import { randomBytes } from "crypto";
import { writeAudit } from "@/lib/audit";
import type { StaffSession } from "@/lib/auth/session";
import { query } from "@/lib/db";
import { withTx, type TxQuery } from "@/lib/dbTx";
import { DomainError, money } from "@/lib/http";
import { getStripe } from "@/lib/payments/stripeClient";
import { countrySql, normalizeCountry } from "@/lib/domain/scope";
import { emitWebhook } from "@/lib/webhooks/emit";

export type SaleItemInput = {
  itemType: "service" | "product" | "package" | "membership" | "gift_card" | "credit";
  referenceId?: string | null;
  description?: string;
  quantity?: number;
  unitPrice?: number;
  discount?: number;
  staffUserId?: string | null;
};

async function priceOf(item: SaleItemInput) {
  if (item.unitPrice != null && !item.referenceId) {
    return { price: item.unitPrice, name: item.description || item.itemType, taxRate: 0 };
  }
  const meta = await catalogPrice(item);
  return { price: item.unitPrice ?? meta.price, name: item.description || meta.name, taxRate: meta.taxRate };
}

async function catalogPrice(item: SaleItemInput) {
  if (item.itemType === "service" && item.referenceId) {
    const row = await query<{ name: string; price: string; rate: string | null }>(
      `SELECT s.name, s.price, t.rate FROM services s LEFT JOIN taxes t ON t.id = s.tax_id WHERE s.id = $1`,
      [item.referenceId]
    );
    if (!row.rows[0]) throw new DomainError("Servicio no encontrado.");
    return { price: Number(row.rows[0].price), name: row.rows[0].name, taxRate: Number(row.rows[0].rate || 0) };
  }
  if (item.itemType === "product" && item.referenceId) {
    const row = await query<{ name: string; price: string; rate: string | null }>(
      `SELECT p.name, p.price, t.rate FROM products p LEFT JOIN taxes t ON t.id = p.tax_id WHERE p.id = $1`,
      [item.referenceId]
    );
    if (!row.rows[0]) throw new DomainError("Producto no encontrado.");
    return { price: Number(row.rows[0].price), name: row.rows[0].name, taxRate: Number(row.rows[0].rate || 0) };
  }
  if (item.itemType === "package" && item.referenceId) {
    const row = await query<{ name: string; price: string }>(`SELECT name, price FROM packages WHERE id = $1`, [item.referenceId]);
    if (!row.rows[0]) throw new DomainError("Paquete no encontrado.");
    return { price: Number(row.rows[0].price), name: row.rows[0].name, taxRate: 0 };
  }
  if (item.itemType === "membership" && item.referenceId) {
    const row = await query<{ name: string; price: string }>(`SELECT name, price FROM memberships WHERE id = $1`, [item.referenceId]);
    if (!row.rows[0]) throw new DomainError("Membresía no encontrada.");
    return { price: Number(row.rows[0].price), name: row.rows[0].name, taxRate: 0 };
  }
  if (item.itemType === "gift_card" || item.itemType === "credit") {
    if (item.unitPrice == null) throw new DomainError("Indica el monto.");
    return { price: item.unitPrice, name: item.description || (item.itemType === "gift_card" ? "Tarjeta de regalo" : "Abono a cuenta"), taxRate: 0 };
  }
  throw new DomainError("Ítem de venta incompleto.");
}

async function applySideEffects(q: TxQuery, item: SaleItemInput, qty: number, saleId: string, patientId: string | null, locationId: string | null, staffId: string | null) {
  if (item.itemType === "product" && item.referenceId) {
    if (!locationId) throw new DomainError("La venta de productos requiere una sede.");
    await q(
      `INSERT INTO product_stock (product_id, location_id, quantity) VALUES ($1,$2,0)
       ON CONFLICT (product_id, location_id) DO NOTHING`,
      [item.referenceId, locationId]
    );
    const updated = await q(
      `UPDATE product_stock SET quantity = quantity - $3
       WHERE product_id = $1 AND location_id = $2 AND quantity >= $3`,
      [item.referenceId, locationId, qty]
    );
    if (updated.rowCount !== 1) throw new DomainError("Stock insuficiente.");
    await q(
      `INSERT INTO stock_movements (product_id, location_id, movement_type, quantity, reason, staff_user_id)
       VALUES ($1,$2,'sale',$3,$4,$5)`,
      [item.referenceId, locationId, -qty, saleId, staffId]
    );
  }
  if (item.itemType === "package" && item.referenceId && patientId) {
    const items = await q<{ quantity: number }>(`SELECT coalesce(sum(quantity),1)::int AS quantity FROM package_items WHERE package_id = $1`, [item.referenceId]);
    await q(
      `INSERT INTO patient_packages (patient_id, package_id, remaining_quantity, sale_id)
       VALUES ($1,$2,$3,$4)`,
      [patientId, item.referenceId, (items.rows[0]?.quantity || 1) * qty, saleId]
    );
  }
  if (item.itemType === "membership" && item.referenceId && patientId) {
    const plan = await q<{ interval_unit: string }>(`SELECT interval_unit FROM memberships WHERE id = $1`, [item.referenceId]);
    const unit = plan.rows[0]?.interval_unit === "year" ? "year" : "month";
    await q(
      `INSERT INTO patient_memberships (patient_id, membership_id, current_period_end)
       VALUES ($1,$2, current_date + CASE WHEN $3 = 'year' THEN interval '1 year' ELSE interval '1 month' END)`,
      [patientId, item.referenceId, unit]
    );
  }
  if (item.itemType === "gift_card") {
    const code = randomBytes(6).toString("hex").toUpperCase();
    const amount = (item.unitPrice || 0) * qty;
    await q(
      `INSERT INTO gift_cards (code, initial_amount, balance, issued_to_patient_id) VALUES ($1,$2,$2,$3)`,
      [code, amount, patientId]
    );
  }
  if (item.itemType === "credit" && patientId) {
    const amount = (item.unitPrice || 0) * qty;
    await q(`INSERT INTO account_credits (patient_id, amount, balance, note) VALUES ($1,$2,$2,$3)`, [
      patientId,
      amount,
      "Abono en punto de venta",
    ]);
  }
}

export async function recalcSale(saleId: string) {
  const sale = await query<{ total: string; status: string }>(`SELECT total, status FROM sales WHERE id = $1`, [saleId]);
  if (!sale.rows[0] || sale.rows[0].status === "void") return;
  const paid = await query<{ sum: string }>(
    `SELECT coalesce(sum(amount),0)::text AS sum FROM payments WHERE sale_id = $1 AND status = 'succeeded'`,
    [saleId]
  );
  const paidTotal = money(Number(paid.rows[0].sum));
  const total = money(Number(sale.rows[0].total));
  const balance = money(total - paidTotal);
  const status = balance <= 0 && total >= 0 ? "paid" : paidTotal > 0 ? "partial" : "open";
  await query(`UPDATE sales SET paid_total = $2, balance = $3, status = $4 WHERE id = $1`, [
    saleId,
    paidTotal,
    Math.max(0, balance),
    status,
  ]);
  await query(
    `UPDATE invoices SET paid_total = $2, status = $3 WHERE sale_id = $1 AND status <> 'void'`,
    [saleId, paidTotal, status === "paid" ? "paid" : status === "partial" ? "partial" : "open"]
  );
}

export async function createSale(
  input: {
    patientId?: string | null;
    walkInName?: string | null;
    locationId?: string | null;
    items: SaleItemInput[];
    notes?: string | null;
    payment?: { methodKey: string; amount: number } | null;
  },
  actor: StaffSession
) {
  if (!input.items?.length) throw new DomainError("Agrega al menos un ítem.");
  const priced: { item: SaleItemInput; quantity: number; unitPrice: number; discount: number; tax: number; line: number; name: string }[] = [];
  for (const item of input.items) {
    const meta = await priceOf({ ...item, unitPrice: item.unitPrice });
    const quantity = item.quantity && item.quantity > 0 ? item.quantity : 1;
    const discount = item.discount || 0;
    const net = money(meta.price * quantity - discount);
    const tax = money(net * (meta.taxRate / 100));
    priced.push({ item, quantity, unitPrice: meta.price, discount, tax, line: money(net + tax), name: item.description || meta.name });
  }
  const subtotal = money(priced.reduce((sum, row) => sum + row.unitPrice * row.quantity, 0));
  const discountTotal = money(priced.reduce((sum, row) => sum + row.discount, 0));
  const taxTotal = money(priced.reduce((sum, row) => sum + row.tax, 0));
  const total = money(priced.reduce((sum, row) => sum + row.line, 0));

  const staffId = actor.staff.email === "api" ? null : actor.staff.id;
  const saleId = await withTx(async (q) => {
    const number = await q<{ n: string }>(`SELECT 'V-' || lpad(nextval('sale_number_seq')::text, 6, '0') AS n`);
    const sale = await q<{ id: string }>(
      `INSERT INTO sales (sale_number, patient_id, walk_in_name, location_id, staff_user_id, subtotal, discount_total, tax_total, total, balance, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$9,$10) RETURNING id`,
      [
        number.rows[0].n,
        input.patientId ?? null,
        input.walkInName ?? null,
        input.locationId ?? null,
        staffId,
        subtotal,
        discountTotal,
        taxTotal,
        total,
        input.notes ?? null,
      ]
    );
    const id = sale.rows[0].id;
    for (const row of priced) {
      await q(
        `INSERT INTO sale_items (sale_id, item_type, reference_id, description, quantity, unit_price, discount, tax_amount, line_total, staff_user_id)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [id, row.item.itemType, row.item.referenceId ?? null, row.name, row.quantity, row.unitPrice, row.discount, row.tax, row.line, row.item.staffUserId ?? staffId]
      );
      await applySideEffects(q, { ...row.item, unitPrice: row.unitPrice }, row.quantity, id, input.patientId ?? null, input.locationId ?? null, staffId);
    }
    const invoiceNo = await q<{ n: string }>(`SELECT 'F-' || lpad(nextval('invoice_number_seq')::text, 6, '0') AS n`);
    let snapshot = { name: input.walkInName || "Mostrador" };
    if (input.patientId) {
      const patient = await q<{ first_name: string; last_name: string; client_code: string; city: string | null }>(
        `SELECT first_name, last_name, client_code, city FROM patients WHERE id = $1`,
        [input.patientId]
      );
      if (patient.rows[0]) {
        snapshot = {
          name: `${patient.rows[0].first_name} ${patient.rows[0].last_name}`,
          clientCode: patient.rows[0].client_code,
          city: patient.rows[0].city,
        } as { name: string };
      }
    }
    await q(
      `INSERT INTO invoices (invoice_number, sale_id, patient_id, location_id, subtotal, discount_total, tax_total, total, billing_snapshot)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb)`,
      [invoiceNo.rows[0].n, id, input.patientId ?? null, input.locationId ?? null, subtotal, discountTotal, taxTotal, total, JSON.stringify(snapshot)]
    );
    return id;
  });

  let stripe: { clientSecret: string | null; paymentIntentId: string | null } | null = null;
  if (input.payment && input.payment.amount > 0) {
    stripe = await addPayment(saleId, input.payment.methodKey, input.payment.amount, actor);
  }
  await emitWebhook("sale.created", { saleId });
  await writeAudit({
    actorType: "staff",
    actorId: actor.staff.id,
    action: "sale.create",
    entityType: "sale",
    entityId: saleId,
    patientId: input.patientId ?? null,
  });
  return { sale: await getSale(saleId), stripe };
}

export async function getSale(id: string) {
  const sale = await query(`SELECT * FROM sales WHERE id = $1`, [id]);
  if (!sale.rows[0]) throw new DomainError("Venta no encontrada.", 404);
  const items = await query(`SELECT * FROM sale_items WHERE sale_id = $1`, [id]);
  const payments = await query(
    `SELECT p.*, m.key AS method_key, m.name AS method_name FROM payments p
     LEFT JOIN payment_methods m ON m.id = p.method_id WHERE p.sale_id = $1 ORDER BY p.created_at`,
    [id]
  );
  const invoice = await query(`SELECT * FROM invoices WHERE sale_id = $1`, [id]);
  return { ...sale.rows[0], items: items.rows, payments: payments.rows, invoice: invoice.rows[0] ?? null };
}

export async function listSales(url: URL) {
  const page = Math.max(1, Number(url.searchParams.get("page") || 1));
  const pageSize = 25;
  const offset = (page - 1) * pageSize;
  const locationId = url.searchParams.get("locationId") || null;
  const country = normalizeCountry(url.searchParams.get("country"));
  const filters = [locationId, country];
  const where = `WHERE ($1::uuid IS NULL OR s.location_id = $1) AND ${countrySql("s.location_id", "$2")}`;
  const rows = await query(
    `SELECT s.*, p.first_name, p.last_name, l.name AS location_name FROM sales s
     LEFT JOIN patients p ON p.id = s.patient_id
     LEFT JOIN locations l ON l.id = s.location_id
     ${where}
     ORDER BY s.created_at DESC LIMIT $3 OFFSET $4`,
    [...filters, pageSize, offset]
  );
  const total = await query<{ n: number }>(`SELECT count(*)::int AS n FROM sales s ${where}`, filters);
  const summary = await query<{ today: number; week: number; month: number; avg_ticket: number }>(
    `SELECT
       coalesce(sum(s.total) FILTER (WHERE s.status <> 'void' AND (s.created_at AT TIME ZONE 'America/Chicago')::date = (now() AT TIME ZONE 'America/Chicago')::date), 0)::float AS today,
       coalesce(sum(s.total) FILTER (WHERE s.status <> 'void' AND (s.created_at AT TIME ZONE 'America/Chicago')::date >= date_trunc('week', now() AT TIME ZONE 'America/Chicago')::date), 0)::float AS week,
       coalesce(sum(s.total) FILTER (WHERE s.status <> 'void' AND (s.created_at AT TIME ZONE 'America/Chicago')::date >= date_trunc('month', now() AT TIME ZONE 'America/Chicago')::date), 0)::float AS month,
       coalesce(avg(s.total) FILTER (WHERE s.status <> 'void' AND (s.created_at AT TIME ZONE 'America/Chicago')::date >= date_trunc('month', now() AT TIME ZONE 'America/Chicago')::date), 0)::float AS avg_ticket
     FROM sales s
     ${where}`,
    filters
  );
  return { rows: rows.rows, total: total.rows[0].n, page, pageSize, summary: summary.rows[0] };
}

export async function addPayment(saleId: string, methodKey: string, amount: number, actor: StaffSession) {
  const sale = await query<{ patient_id: string | null; balance: string; status: string }>(
    `SELECT patient_id, balance, status FROM sales WHERE id = $1`,
    [saleId]
  );
  if (!sale.rows[0]) throw new DomainError("Venta no encontrada.", 404);
  if (sale.rows[0].status === "void") throw new DomainError("La venta está anulada.");
  if (amount <= 0) throw new DomainError("El monto debe ser mayor a cero.");
  const method = await query<{ id: string }>(`SELECT id FROM payment_methods WHERE key = $1 AND is_active`, [methodKey]);
  if (!method.rows[0]) throw new DomainError("Método de pago no válido.");
  const invoice = await query<{ id: string }>(`SELECT id FROM invoices WHERE sale_id = $1`, [saleId]);
  let stripePaymentIntentId: string | null = null;
  let clientSecret: string | null = null;
  let status = "succeeded";
  if (methodKey === "stripe") {
    const stripe = getStripe();
    if (!stripe) throw new DomainError("Stripe no está configurado.", 503);
    const intent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: "usd",
      metadata: { saleId },
      automatic_payment_methods: { enabled: true },
    });
    stripePaymentIntentId = intent.id;
    clientSecret = intent.client_secret;
    status = "pending";
  }
  await query(
    `INSERT INTO payments (sale_id, invoice_id, patient_id, method_id, amount, status, stripe_payment_intent_id, received_at, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7, CASE WHEN $6 = 'succeeded' THEN now() ELSE NULL END, $8)`,
    [saleId, invoice.rows[0]?.id ?? null, sale.rows[0].patient_id, method.rows[0].id, money(amount), status, stripePaymentIntentId, actor.staff.id]
  );
  if (status === "succeeded") await recalcSale(saleId);
  await writeAudit({
    actorType: "staff",
    actorId: actor.staff.id,
    action: "payment.create",
    entityType: "sale",
    entityId: saleId,
    patientId: sale.rows[0].patient_id,
    metadata: { method: methodKey, status },
  });
  return { clientSecret, paymentIntentId: stripePaymentIntentId };
}

export async function markStripePaid(paymentIntentId: string) {
  const payment = await query<{ id: string; sale_id: string | null }>(
    `SELECT id, sale_id FROM payments WHERE stripe_payment_intent_id = $1`,
    [paymentIntentId]
  );
  if (!payment.rows[0]) return;
  await query(
    `UPDATE payments SET status = 'succeeded', received_at = coalesce(received_at, now()) WHERE id = $1 AND status = 'pending'`,
    [payment.rows[0].id]
  );
  if (payment.rows[0].sale_id) await recalcSale(payment.rows[0].sale_id);
}

export async function voidSale(saleId: string, reason: string, actor: StaffSession) {
  const sale = await query<{ id: string; status: string; patient_id: string | null }>(
    `SELECT id, status, patient_id FROM sales WHERE id = $1`,
    [saleId]
  );
  if (!sale.rows[0]) throw new DomainError("Venta no encontrada.", 404);
  if (sale.rows[0].status === "void") throw new DomainError("La venta ya está anulada.");
  const note = reason.trim() || "Anulada en clínica";
  await query(`UPDATE sales SET status = 'void' WHERE id = $1`, [saleId]);
  await query(`UPDATE invoices SET status = 'void' WHERE sale_id = $1 AND status <> 'void'`, [saleId]);
  await query(
    `UPDATE payments SET status = 'void', voided_at = now(), void_reason = $2 WHERE sale_id = $1 AND status <> 'void'`,
    [saleId, note]
  );
  await writeAudit({
    actorType: "staff",
    actorId: actor.staff.id,
    action: "sale.void",
    entityType: "sale",
    entityId: saleId,
    patientId: sale.rows[0].patient_id,
    metadata: { reason: note },
  });
}

export async function voidPayment(paymentId: string, reason: string, actor: StaffSession) {
  const payment = await query<{
    id: string;
    sale_id: string | null;
    status: string;
    stripe_payment_intent_id: string | null;
    patient_id: string | null;
    amount: string;
  }>(`SELECT id, sale_id, status, stripe_payment_intent_id, patient_id, amount FROM payments WHERE id = $1`, [paymentId]);
  const row = payment.rows[0];
  if (!row) throw new DomainError("Pago no encontrado.", 404);
  if (row.status === "void") throw new DomainError("El pago ya está anulado.");
  if (row.stripe_payment_intent_id && row.status === "succeeded") {
    const stripe = getStripe();
    if (stripe) {
      await stripe.refunds.create({ payment_intent: row.stripe_payment_intent_id });
    }
  }
  await query(`UPDATE payments SET status = 'void', voided_at = now(), void_reason = $2 WHERE id = $1`, [paymentId, reason || null]);
  if (row.sale_id) await recalcSale(row.sale_id);
  await writeAudit({
    actorType: "staff",
    actorId: actor.staff.id,
    action: "payment.void",
    entityType: "payment",
    entityId: paymentId,
    patientId: row.patient_id,
  });
}

export async function createCreditNote(invoiceId: string, amount: number, reason: string, actor: StaffSession) {
  const invoice = await query<{ id: string; total: string; patient_id: string | null }>(
    `SELECT id, total, patient_id FROM invoices WHERE id = $1`,
    [invoiceId]
  );
  if (!invoice.rows[0]) throw new DomainError("Factura no encontrada.", 404);
  if (amount <= 0 || amount > Number(invoice.rows[0].total)) throw new DomainError("Monto de nota de crédito no válido.");
  const number = await query<{ n: string }>(`SELECT 'NC-' || lpad(nextval('credit_note_number_seq')::text, 6, '0') AS n`);
  const inserted = await query<{ id: string }>(
    `INSERT INTO credit_notes (credit_number, invoice_id, amount, reason, created_by) VALUES ($1,$2,$3,$4,$5) RETURNING id`,
    [number.rows[0].n, invoiceId, money(amount), reason || null, actor.staff.id]
  );
  await query(`UPDATE invoices SET total = total - $2, status = CASE WHEN total - $2 <= paid_total THEN 'paid' ELSE status END WHERE id = $1`, [
    invoiceId,
    money(amount),
  ]);
  await writeAudit({
    actorType: "staff",
    actorId: actor.staff.id,
    action: "credit_note.create",
    entityType: "invoice",
    entityId: invoiceId,
    patientId: invoice.rows[0].patient_id,
  });
  return { id: inserted.rows[0].id, number: number.rows[0].n };
}

export async function createQuote(
  input: { patientId?: string | null; locationId?: string | null; validUntil?: string | null; notes?: string | null; items: { description: string; quantity: number; unitPrice: number; taxAmount?: number }[] },
  actor: StaffSession
) {
  if (!input.items?.length) throw new DomainError("La cotización necesita ítems.");
  const lines = input.items.map((item) => {
    const net = item.quantity * item.unitPrice;
    const tax = item.taxAmount || 0;
    return { ...item, tax, line: money(net + tax) };
  });
  const subtotal = money(lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0));
  const taxTotal = money(lines.reduce((s, l) => s + l.tax, 0));
  const total = money(lines.reduce((s, l) => s + l.line, 0));
  const number = await query<{ n: string }>(`SELECT 'C-' || lpad(nextval('quote_number_seq')::text, 6, '0') AS n`);
  const quote = await query<{ id: string }>(
    `INSERT INTO quotes (quote_number, patient_id, location_id, valid_until, subtotal, tax_total, total, notes)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
    [number.rows[0].n, input.patientId ?? null, input.locationId ?? null, input.validUntil || null, subtotal, taxTotal, total, input.notes ?? null]
  );
  for (const line of lines) {
    await query(
      `INSERT INTO quote_items (quote_id, description, quantity, unit_price, tax_amount, line_total) VALUES ($1,$2,$3,$4,$5,$6)`,
      [quote.rows[0].id, line.description, line.quantity, line.unitPrice, line.tax, line.line]
    );
  }
  await writeAudit({ actorType: "staff", actorId: actor.staff.id, action: "quote.create", entityType: "quote", entityId: quote.rows[0].id, patientId: input.patientId ?? null });
  return { id: quote.rows[0].id, number: number.rows[0].n };
}
