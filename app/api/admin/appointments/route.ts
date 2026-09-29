import { isSession, requirePermission } from "@/lib/auth/guard";
import { createAppointment, listAppointments, type AppointmentInput } from "@/lib/domain/appointments";
import { availabilityForDate } from "@/lib/scheduling/availability";
import { readJson, requestMeta, toErrorResponse } from "@/lib/http";

export async function GET(req: Request) {
  const session = await requirePermission("appointments.read");
  if (!isSession(session)) return session;
  const url = new URL(req.url);
  if (url.searchParams.get("mode") === "availability") {
    try {
      const slots = await availabilityForDate({
        serviceId: url.searchParams.get("serviceId") || "",
        date: url.searchParams.get("date") || "",
        locationId: url.searchParams.get("locationId"),
        staffUserId: url.searchParams.get("staffUserId"),
      });
      return Response.json({ slots });
    } catch (error) {
      return toErrorResponse(error);
    }
  }
  try {
    const from = url.searchParams.get("from") || new Date().toISOString();
    const to = url.searchParams.get("to") || new Date(Date.now() + 7 * 86400000).toISOString();
    const rows = await listAppointments(from, to, {
      staffUserId: url.searchParams.get("staffUserId") || undefined,
      locationId: url.searchParams.get("locationId") || undefined,
      roomId: url.searchParams.get("roomId") || undefined,
      patientId: url.searchParams.get("patientId") || undefined,
    });
    return Response.json({ rows });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function POST(req: Request) {
  const session = await requirePermission("appointments.write");
  if (!isSession(session)) return session;
  try {
    const body = (await readJson(req)) as AppointmentInput;
    const created = await createAppointment(body, session, requestMeta(req));
    return Response.json(created);
  } catch (error) {
    return toErrorResponse(error);
  }
}
