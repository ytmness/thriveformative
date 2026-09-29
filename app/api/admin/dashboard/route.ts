import { isSession, requirePermission } from "@/lib/auth/guard";
import { dashboardStats } from "@/lib/domain/reports";
import { toErrorResponse } from "@/lib/http";

export async function GET() {
  const session = await requirePermission("dashboard.read");
  if (!isSession(session)) return session;
  try {
    return Response.json(await dashboardStats());
  } catch (error) {
    return toErrorResponse(error);
  }
}
