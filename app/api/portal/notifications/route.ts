import { currentPatient } from "@/lib/auth/patientAccess";
import { query } from "@/lib/db";
import { readJson, toErrorResponse } from "@/lib/http";

export async function GET() {
  const patient = await currentPatient();
  if (!patient) return Response.json({ error: "No autorizado" }, { status: 401 });
  const rows = await query(
    `SELECT id, type, title, body, reference_id, read_at, created_at
     FROM notifications
     WHERE patient_id = $1
     ORDER BY created_at DESC
     LIMIT 20`,
    [patient.id]
  );
  return Response.json({ rows: rows.rows });
}

export async function PATCH(req: Request) {
  const patient = await currentPatient();
  if (!patient) return Response.json({ error: "No autorizado" }, { status: 401 });
  try {
    const body = await readJson(req);
    if (body.id) {
      await query(
        `UPDATE notifications SET read_at = now() WHERE id = $1 AND patient_id = $2`,
        [String(body.id), patient.id]
      );
    }
    return Response.json({ ok: true });
  } catch (error) {
    return toErrorResponse(error);
  }
}
