import { isSession, requirePermission } from "@/lib/auth/guard";
import { dashboardStats } from "@/lib/domain/reports";
import { toErrorResponse } from "@/lib/http";

export async function GET(req: Request) {
  const session = await requirePermission("dashboard.read");
  if (!isSession(session)) return session;
  const url = new URL(req.url);
  try {
    return Response.json(await dashboardStats("America/Chicago", {
      locationId: url.searchParams.get("locationId"),
      country: url.searchParams.get("country"),
    }));
  } catch (error) {
    return toErrorResponse(error);
  }
}
