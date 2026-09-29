import { NextResponse } from "next/server";
import { getPortalSession } from "@/lib/auth/portal";
import { updateAppointment } from "@/lib/domain/appointments";
import { query } from "@/lib/db";
import { readJson, requestMeta, toErrorResponse, DomainError } from "@/lib/http";

export async function POST(req: Request) {
  const session = await getPortalSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  try {
    const body = await readJson(req);
    const owned = await query<{ id: string }>(
      `SELECT id FROM appointments WHERE id = $1 AND patient_id = $2`,
      [String(body.appointmentId || ""), session.patientId]
    );
    if (!owned.rows[0]) throw new DomainError("Cita no encontrada.", 404);
    const settings = await query<{ cancel_window_hours: number }>(`SELECT cancel_window_hours FROM booking_settings WHERE id = 1`);
    const current = await query<{ starts_at: string }>(`SELECT starts_at FROM appointments WHERE id = $1`, [owned.rows[0].id]);
    const hours = (new Date(current.rows[0].starts_at).getTime() - Date.now()) / 36e5;
    if (hours < (settings.rows[0]?.cancel_window_hours ?? 24)) {
      throw new DomainError("Ya pasó el plazo para cambiar esta cita.");
    }
    if (body.action === "cancel") {
      return Response.json({ appointment: await updateAppointment(owned.rows[0].id, { status: "cancelled", cancelReason: "Cancelada desde el portal" }, null, requestMeta(req)) });
    }
    return Response.json({
      appointment: await updateAppointment(owned.rows[0].id, { startsAt: String(body.startsAt || ""), status: "booked" }, null, requestMeta(req)),
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}
