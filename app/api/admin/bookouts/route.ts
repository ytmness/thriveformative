import { isSession, requirePermission } from "@/lib/auth/guard";
import { query } from "@/lib/db";
import { readJson, toErrorResponse, DomainError } from "@/lib/http";

export async function GET(req: Request) {
  const session = await requirePermission("appointments.read");
  if (!isSession(session)) return session;
  const url = new URL(req.url);
  const rows = await query(
    `SELECT * FROM bookouts WHERE starts_at < $2 AND ends_at > $1 ORDER BY starts_at`,
    [url.searchParams.get("from") || new Date().toISOString(), url.searchParams.get("to") || new Date(Date.now() + 7 * 86400000).toISOString()]
  );
  return Response.json({ rows: rows.rows });
}

export async function POST(req: Request) {
  const session = await requirePermission("appointments.write");
  if (!isSession(session)) return session;
  try {
    const body = await readJson(req);
    if (!body.startsAt || !body.endsAt) throw new DomainError("Indica inicio y fin del bloqueo.");
    const inserted = await query<{ id: string }>(
      `INSERT INTO bookouts (staff_user_id, room_id, location_id, starts_at, ends_at, all_day, kind, reason, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
      [body.staffUserId || null, body.roomId || null, body.locationId || null, body.startsAt, body.endsAt, Boolean(body.allDay), body.kind || "block", body.reason || null, session.staff.id]
    );
    return Response.json({ id: inserted.rows[0].id });
  } catch (error) {
    return toErrorResponse(error);
  }
}
