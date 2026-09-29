import { isSession, requirePermission } from "@/lib/auth/guard";
import { adjustStock, exportInventory, listProducts, saveProduct, saveSimple } from "@/lib/domain/catalog";
import { readJson, toErrorResponse } from "@/lib/http";

export async function GET(req: Request) {
  const session = await requirePermission("inventory.read");
  if (!isSession(session)) return session;
  const url = new URL(req.url);
  if (url.searchParams.get("export")) {
    const file = await exportInventory(url.searchParams.get("format") || "csv");
    return new Response(file.body, {
      headers: {
        "Content-Type": file.contentType,
        "Content-Disposition": `attachment; filename="${file.filename}"`,
      },
    });
  }
  const kind = url.searchParams.get("kind");
  if (kind === "movements") {
    const { query } = await import("@/lib/db");
    const rows = await query(
      `SELECT m.id, m.movement_type, m.quantity, m.reason, m.created_at, p.name AS product_name, l.name AS location_name
       FROM stock_movements m
       JOIN products p ON p.id = m.product_id
       JOIN locations l ON l.id = m.location_id
       ORDER BY m.created_at DESC LIMIT 40`
    );
    return Response.json({ rows: rows.rows });
  }
  if (kind === "packages" || kind === "memberships") {
    const { listSection } = await import("@/lib/domain/settings");
    return Response.json({ rows: await listSection(kind) });
  }
  return Response.json({ rows: await listProducts() });
}

export async function POST(req: Request) {
  const session = await requirePermission("inventory.write");
  if (!isSession(session)) return session;
  try {
    const body = await readJson(req);
    if (body.kind === "stock") return Response.json(await adjustStock(body, session));
    if (body.kind === "package" || body.kind === "membership") {
      return Response.json(await saveSimple(body.kind === "package" ? "packages" : "memberships", null, body));
    }
    return Response.json(await saveProduct(null, body));
  } catch (error) {
    return toErrorResponse(error);
  }
}
