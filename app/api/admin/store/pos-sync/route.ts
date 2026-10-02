import { NextRequest } from "next/server";
import { isSession, requireStaff } from "@/lib/auth/guard";
import { copyStoreProductsToPos } from "@/lib/store/posCatalog";
import { jsonOk, handleRouteError } from "@/lib/security/errors";
import { readJsonBody } from "@/lib/security/request";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const session = await requireStaff();
  if (!isSession(session)) return session;
  try {
    const body = (await readJsonBody(request).catch(() => ({}))) as { country?: unknown };
    const country = typeof body.country === "string" ? body.country : null;
    const result = await copyStoreProductsToPos(country);
    return jsonOk(result);
  } catch (error) {
    return handleRouteError("store-pos-sync", error);
  }
}
