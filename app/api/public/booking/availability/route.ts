import { NextResponse } from "next/server";
import { currentPatient } from "@/lib/auth/patientAccess";
import { availabilityForDate, openDates } from "@/lib/scheduling/availability";
import { requestMeta, toErrorResponse } from "@/lib/http";
import { checkRateLimit } from "@/lib/rate-limit/memory";
import { requestMarket } from "@/lib/site/requestMarket";

export async function GET(req: Request) {
  const meta = requestMeta(req);
  const limit = checkRateLimit(`avail:${meta.ip || "unknown"}`, { limit: 60, windowMs: 60 * 1000 });
  if (!limit.allowed) return NextResponse.json({ error: "Demasiadas solicitudes." }, { status: 429 });
  const url = new URL(req.url);
  try {
    const patient = await currentPatient();
    const month = url.searchParams.get("month") || "";
    if (/^\d{4}-\d{2}$/.test(month)) {
      const [year, monthIndex] = month.split("-").map(Number);
      const last = new Date(year, monthIndex, 0).getDate();
      const dates = await openDates({
        serviceId: url.searchParams.get("serviceId") || "",
        from: `${month}-01`,
        to: `${month}-${String(last).padStart(2, "0")}`,
        locationId: url.searchParams.get("locationId"),
        country: await requestMarket(),
        patientId: patient?.id ?? null,
      });
      return Response.json({ dates });
    }
    const slots = await availabilityForDate({
      serviceId: url.searchParams.get("serviceId") || "",
      date: url.searchParams.get("date") || "",
      locationId: url.searchParams.get("locationId"),
      staffUserId: url.searchParams.get("staffUserId"),
      country: await requestMarket(),
      patientId: patient?.id ?? null,
    });
    return Response.json({ slots });
  } catch (error) {
    return toErrorResponse(error);
  }
}
