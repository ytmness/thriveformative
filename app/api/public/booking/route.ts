import { NextResponse } from "next/server";
import { bookPublic, joinWaitlist, managePublic } from "@/lib/domain/publicBooking";
import { findByManageToken } from "@/lib/domain/appointments";
import { readJson, requestMeta, toErrorResponse } from "@/lib/http";
import { checkRateLimit } from "@/lib/rate-limit/memory";

function limited(req: Request, key: string, limit: number) {
  const meta = requestMeta(req);
  const result = checkRateLimit(`${key}:${meta.ip || "unknown"}`, { limit, windowMs: 15 * 60 * 1000 });
  if (!result.allowed) return NextResponse.json({ error: "Demasiadas solicitudes." }, { status: 429 });
  return null;
}

export async function POST(req: Request) {
  const blocked = limited(req, "book", 10);
  if (blocked) return blocked;
  try {
    return Response.json(await bookPublic(await readJson(req), requestMeta(req)));
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function PUT(req: Request) {
  const blocked = limited(req, "manage", 20);
  if (blocked) return blocked;
  try {
    const body = await readJson(req);
    if (body.action === "waitlist") return Response.json(await joinWaitlist(body));
    return Response.json({ appointment: await managePublic(String(body.token || ""), body, requestMeta(req)) });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token") || "";
  const appointment = await findByManageToken(token);
  if (!appointment) return NextResponse.json({ error: "Cita no encontrada." }, { status: 404 });
  return Response.json({
    appointment: {
      id: appointment.id,
      startsAt: appointment.startsAt,
      endsAt: appointment.endsAt,
      status: appointment.status,
      serviceName: appointment.serviceName,
      staffName: appointment.staffName,
      locationName: appointment.locationName,
      locationId: appointment.locationId,
      serviceId: appointment.serviceId,
      staffUserId: appointment.staffUserId,
    },
  });
}
