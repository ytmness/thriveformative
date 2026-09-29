import { isSession, requirePermission } from "@/lib/auth/guard";
import { query } from "@/lib/db";
import { createCreditNote, createQuote } from "@/lib/domain/sales";
import { readJson, toErrorResponse } from "@/lib/http";

export async function GET(req: Request) {
  const session = await requirePermission("invoices.read");
  if (!isSession(session)) return session;
  const url = new URL(req.url);
  const kind = url.searchParams.get("kind");
  if (kind === "quotes") {
    const rows = await query(`SELECT * FROM quotes ORDER BY created_at DESC LIMIT 100`);
    return Response.json({ rows: rows.rows });
  }
  if (kind === "credits") {
    const rows = await query(`SELECT * FROM credit_notes ORDER BY created_at DESC LIMIT 100`);
    return Response.json({ rows: rows.rows });
  }
  const rows = await query(
    `SELECT i.*, p.first_name, p.last_name FROM invoices i LEFT JOIN patients p ON p.id = i.patient_id ORDER BY i.issued_at DESC LIMIT 100`
  );
  return Response.json({ rows: rows.rows });
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
