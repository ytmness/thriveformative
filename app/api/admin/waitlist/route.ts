import { isSession, requirePermission } from "@/lib/auth/guard";
import { query } from "@/lib/db";
import { DomainError, readJson, toErrorResponse } from "@/lib/http";

export async function GET() {
  const session = await requirePermission("appointments.read");
  if (!isSession(session)) return session;
  const rows = await query(
    `SELECT w.id, w.status, w.notes, w.desired_from, w.created_at,
            p.first_name, p.last_name, s.name AS service_name, u.first_name AS staff_first, u.last_name AS staff_last
     FROM waitlist_entries w
     LEFT JOIN patients p ON p.id = w.patient_id
     LEFT JOIN services s ON s.id = w.service_id
     LEFT JOIN staff_users u ON u.id = w.staff_user_id
     WHERE w.status = 'waiting'
     ORDER BY w.created_at`
  );
  return Response.json({ rows: rows.rows });
}

export async function POST(req: Request) {
  const session = await requirePermission("appointments.write");
  if (!isSession(session)) return session;
  try {
    const body = await readJson(req);
    if (!body.patientId) throw new DomainError("Elige un paciente para la lista de espera.");
    const inserted = await query<{ id: string }>(
      `INSERT INTO waitlist_entries (patient_id, service_id, staff_user_id, location_id, notes)
       VALUES ($1,$2,$3,$4,$5) RETURNING id`,
      [body.patientId, body.serviceId || null, body.staffUserId || null, body.locationId || null, body.notes || null]
    );
    return Response.json({ id: inserted.rows[0].id });
  } catch (error) {
    return toErrorResponse(error);
  }
}
