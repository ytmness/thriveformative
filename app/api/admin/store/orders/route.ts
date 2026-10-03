import { isSession, requirePermission } from "@/lib/auth/guard";
import { toErrorResponse } from "@/lib/http";
import { listStoreOrders } from "@/lib/store/storeOrders";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await requirePermission("sales.read");
  if (!isSession(session)) return session;
  try {
    return Response.json({ rows: await listStoreOrders() });
  } catch (error) {
    return toErrorResponse(error);
  }
}
