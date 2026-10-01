import { NextRequest } from "next/server";
import { z } from "zod";
import { query } from "@/lib/db";
import { getSquareLocationId, SquareApiError } from "@/lib/square/client";
import { getSquareCredentials, squareWebSdkUrl, SquareConfigError } from "@/lib/square/config";
import { jsonError, jsonOk, handleRouteError } from "@/lib/security/errors";
import { isValidRef } from "@/lib/store/slug";

export const dynamic = "force-dynamic";

const querySchema = z.object({
  locale: z.enum(["es", "en", "ko", "it"]),
  ref: z.string().min(2).max(80),
});

type VariationPayload = {
  id?: string;
  name?: string;
  amount?: number;
  currency?: string;
};

export async function GET(request: NextRequest) {
  try {
    const parsed = querySchema.safeParse({
      locale: request.nextUrl.searchParams.get("locale"),
      ref: request.nextUrl.searchParams.get("ref"),
    });
    if (!parsed.success || !isValidRef(parsed.data.ref)) {
      return jsonError(400, "Solicitud inválida.");
    }

    const credentials = getSquareCredentials();
    const locationId = await getSquareLocationId();
    const result = await query<{ name: string; source: string | null; source_payload: { variations?: VariationPayload[] } | null }>(
      `SELECT name, source, source_payload
       FROM store_products
       WHERE locale = $1 AND ref = $2 AND is_published = true
       LIMIT 1`,
      [parsed.data.locale, parsed.data.ref]
    );
    const data = result.rows[0];
    if (!data || data.source !== "square") {
      return jsonError(404, "Este producto no se cobra con Square.");
    }

    const variations = (data.source_payload?.variations ?? []).filter(
      (row): row is { id: string; name: string; amount: number; currency: string } =>
        Boolean(row.id && row.name && row.amount && row.amount > 0 && row.currency)
    );
    if (!variations.length) {
      return jsonError(409, "Este producto no tiene un precio cobrable en Square.");
    }

    return jsonOk({
      environment: credentials.environment,
      applicationId: credentials.applicationId,
      locationId,
      sdkUrl: squareWebSdkUrl(credentials.environment),
      productName: data.name,
      variations,
    });
  } catch (error) {
    if (error instanceof SquareConfigError) {
      return jsonError(503, "El pago con tarjeta no está disponible en este momento.");
    }
    if (error instanceof SquareApiError) {
      return jsonError(502, "No se pudo preparar el pago con Square.");
    }
    return handleRouteError("square-checkout-context", error);
  }
}
