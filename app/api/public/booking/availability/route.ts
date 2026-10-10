import { NextResponse } from "next/server";
import { availabilityForDate } from "@/lib/scheduling/availability";
import { requestMeta, toErrorResponse } from "@/lib/http";
import { checkRateLimit } from "@/lib/rate-limit/memory";
import { requestMarket } from "@/lib/site/requestMarket";

export async function GET(req: Request) {
  const meta = requestMeta(req);
  const limit = checkRateLimit(`avail:${meta.ip || "unknown"}`, { limit: 60, windowMs: 60 * 1000 });
  if (!limit.allowed) return NextResponse.json({ error: "Demasiadas solicitudes." }, { status: 429 });
  const url = new URL(req.url);
  try {
    const slots = await availabilityForDate({
      serviceId: url.searchParams.get("serviceId") || "",
      date: url.searchParams.get("date") || "",
      locationId: url.searchParams.get("locationId"),
      staffUserId: url.searchParams.get("staffUserId"),
      country: await requestMarket(),
    });
    return Response.json({ slots });
  } catch (error) {
    return toErrorResponse(error);
  }
}
