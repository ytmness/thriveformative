import { NextRequest } from "next/server";
import { jsonError, jsonOk, handleRouteError } from "@/lib/security/errors";
import { isValidRef } from "@/lib/store/slug";
import { loadPickupAvailability } from "@/lib/store/storeOrders";
import { normalizeCountry } from "@/lib/domain/scope";

export const dynamic = "force-dynamic";

const LOCALES = new Set(["es", "en", "ko", "it"]);

export async function GET(request: NextRequest) {
  try {
    const locale = request.nextUrl.searchParams.get("locale") || "es";
    const refs = (request.nextUrl.searchParams.get("refs") || "")
      .split(",")
      .map((ref) => ref.trim())
      .filter(Boolean)
      .slice(0, 20);
    if (!LOCALES.has(locale) || !refs.length || refs.some((ref) => !isValidRef(ref))) {
      return jsonError(400, "Solicitud inválida.");
    }
    const availability = await loadPickupAvailability(locale, refs, normalizeCountry(request.nextUrl.searchParams.get("country")));
    return jsonOk(availability);
  } catch (error) {
    return handleRouteError("store-pickup", error);
  }
}
