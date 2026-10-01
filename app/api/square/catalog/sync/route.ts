import { NextRequest } from "next/server";
import { isSession, requireStaff } from "@/lib/auth/guard";
import { SquareApiError } from "@/lib/square/client";
import { getSquareCredentials, SquareConfigError } from "@/lib/square/config";
import { syncSquareCatalog } from "@/lib/square/syncCatalog";
import { jsonError, jsonOk, handleRouteError } from "@/lib/security/errors";
import { readJsonBody } from "@/lib/security/request";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const session = await requireStaff();
  if (!isSession(session)) return session;
  try {
    const body = (await readJsonBody(request).catch(() => ({}))) as { country?: unknown };
    const country = typeof body.country === "string" ? body.country : null;
    const credentials = getSquareCredentials();
    const result = await syncSquareCatalog(credentials.environment, country);
    return jsonOk(result);
  } catch (error) {
    if (error instanceof SquareConfigError) return jsonError(503, error.message);
    if (error instanceof SquareApiError) {
      const message =
        error.status === 401
          ? "Square rechazó el token de este ambiente. Revisa SQUARE_ENVIRONMENT y el access token del servidor."
          : error.message;
      return jsonError(502, message);
    }
    return handleRouteError("square-catalog-sync", error);
  }
}
