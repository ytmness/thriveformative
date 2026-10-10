import { isSession, requireStaff } from "@/lib/auth/guard";
import { query } from "@/lib/db";
import { readJson, toErrorResponse } from "@/lib/http";

export async function GET() {
  const session = await requireStaff();
  if (!isSession(session)) return session;
  const rows = await query(
    `SELECT id, type, title, body, reference_id, read_at, created_at
     FROM notifications WHERE patient_id IS NULL ORDER BY created_at DESC LIMIT 20`
  );
  const unread = await query<{ n: number }>(`SELECT count(*)::int AS n FROM notifications WHERE patient_id IS NULL AND read_at IS NULL`);
  return Response.json({ rows: rows.rows, unread: unread.rows[0]?.n ?? 0 });
}

export async function PATCH(req: Request) {
  const session = await requireStaff();
  if (!isSession(session)) return session;
  try {
    const body = await readJson(req);
    if (body.all === true) {
      await query(`UPDATE notifications SET read_at = now() WHERE patient_id IS NULL AND read_at IS NULL`);
    } else if (body.id) {
      await query(`UPDATE notifications SET read_at = now() WHERE id = $1 AND patient_id IS NULL`, [String(body.id)]);
    }
    return Response.json({ ok: true });
  } catch (error) {
    return toErrorResponse(error);
  }
}
