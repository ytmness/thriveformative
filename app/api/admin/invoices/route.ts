import { isSession, requirePermission } from "@/lib/auth/guard";
import { query } from "@/lib/db";
import { createCreditNote, createQuote } from "@/lib/domain/sales";
import { readJson, toErrorResponse } from "@/lib/http";

export async function GET(req: Request) {
  const session = await requirePermission("invoices.read");
  if (!isSession(session)) return session;
  const url = new URL(req.url);
  const kind = url.searchParams.get("kind");
  const id = url.searchParams.get("id");
  if (id) {
    const detail = await documentOf(kind, id);
    if (!detail) return Response.json({ error: "Documento no encontrado." }, { status: 404 });
    return Response.json(detail);
  }
  if (kind === "quotes") {
    const rows = await query(
      `SELECT q.*, p.first_name, p.last_name FROM quotes q
       LEFT JOIN patients p ON p.id = q.patient_id ORDER BY q.created_at DESC LIMIT 100`
    );
    return Response.json({ rows: rows.rows });
  }
  if (kind === "credits") {
    const rows = await query(
      `SELECT c.*, i.invoice_number, p.first_name, p.last_name
       FROM credit_notes c
       JOIN invoices i ON i.id = c.invoice_id
       LEFT JOIN patients p ON p.id = i.patient_id
       ORDER BY c.created_at DESC LIMIT 100`
    );
    return Response.json({ rows: rows.rows });
  }
  const rows = await query(
    `SELECT i.*, p.first_name, p.last_name FROM invoices i LEFT JOIN patients p ON p.id = i.patient_id ORDER BY i.issued_at DESC LIMIT 100`
  );
  return Response.json({ rows: rows.rows });
}

async function documentOf(kind: string | null, id: string) {
  if (kind === "quotes") {
    const quote = await query(
      `SELECT q.*, p.first_name, p.last_name, l.name AS location_name, l.street, l.city, l.state, l.postal_code, l.country, l.phone AS location_phone
       FROM quotes q
       LEFT JOIN patients p ON p.id = q.patient_id
       LEFT JOIN locations l ON l.id = q.location_id
       WHERE q.id = $1`,
      [id]
    );
    if (!quote.rows[0]) return null;
    const items = await query(`SELECT * FROM quote_items WHERE quote_id = $1 ORDER BY description`, [id]);
    return { kind: "quote", document: quote.rows[0], items: items.rows, payments: [] };
  }
  if (kind === "credits") {
    const note = await query(
      `SELECT c.*, i.invoice_number, i.total AS invoice_total, p.first_name, p.last_name,
              l.name AS location_name, l.street, l.city, l.state, l.postal_code, l.country, l.phone AS location_phone
       FROM credit_notes c
       JOIN invoices i ON i.id = c.invoice_id
       LEFT JOIN patients p ON p.id = i.patient_id
       LEFT JOIN locations l ON l.id = i.location_id
       WHERE c.id = $1`,
      [id]
    );
    if (!note.rows[0]) return null;
    return { kind: "credit", document: note.rows[0], items: [], payments: [] };
  }
  const invoice = await query(
    `SELECT i.*, p.first_name, p.last_name, p.client_code,
            l.name AS location_name, l.street, l.city, l.state, l.postal_code, l.country, l.phone AS location_phone,
            COALESCE(pay.paid, 0) AS collected
     FROM invoices i
     LEFT JOIN patients p ON p.id = i.patient_id
     LEFT JOIN locations l ON l.id = i.location_id
     LEFT JOIN LATERAL (
       SELECT SUM(amount) AS paid FROM payments
       WHERE status = 'succeeded' AND voided_at IS NULL
         AND (invoice_id = i.id OR (i.sale_id IS NOT NULL AND sale_id = i.sale_id))
     ) pay ON true
     WHERE i.id = $1`,
    [id]
  );
  if (!invoice.rows[0]) return null;
  const saleId = invoice.rows[0].sale_id;
  const items = saleId
    ? await query(`SELECT * FROM sale_items WHERE sale_id = $1`, [saleId])
    : { rows: [] };
  const payments = await query(
    `SELECT p.amount, p.received_at, p.created_at, p.status, m.name AS method_name
     FROM payments p LEFT JOIN payment_methods m ON m.id = p.method_id
     WHERE p.voided_at IS NULL AND (p.invoice_id = $1 OR ($2::uuid IS NOT NULL AND p.sale_id = $2))
     ORDER BY p.created_at`,
    [id, saleId]
  );
  return { kind: "invoice", document: invoice.rows[0], items: items.rows, payments: payments.rows };
}

export async function POST(req: Request) {
  const session = await requirePermission("invoices.write");
  if (!isSession(session)) return session;
  try {
    const body = await readJson(req);
    if (body.kind === "credit") {
      return Response.json(await createCreditNote(String(body.invoiceId), Number(body.amount), String(body.reason || ""), session));
    }
    return Response.json(await createQuote(body as never, session));
  } catch (error) {
    return toErrorResponse(error);
  }
}
