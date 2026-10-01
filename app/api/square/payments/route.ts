import { NextRequest } from "next/server";
import { z } from "zod";
import { query } from "@/lib/db";
import { getSquareLocationId, SquareApiError } from "@/lib/square/client";
import { SquareConfigError } from "@/lib/square/config";
import { createSquarePayment } from "@/lib/square/payments";
import { jsonError, jsonOk, handleRouteError } from "@/lib/security/errors";
import { checkRateLimit } from "@/lib/rate-limit/memory";
import {
  getClientIp,
  invalidJsonResponse,
  InvalidJsonError,
  PayloadTooLargeError,
  payloadTooLargeResponse,
  rateLimitedResponse,
  readJsonBody,
} from "@/lib/security/request";
import { isValidRef } from "@/lib/store/slug";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  locale: z.enum(["es", "en", "ko", "it"]),
  ref: z.string().min(2).max(80),
  variationId: z.string().min(1).max(128),
  sourceId: z.string().min(1).max(512),
  idempotencyKey: z.string().uuid(),
});

type VariationPayload = {
  id?: string;
  name?: string;
  amount?: number;
  currency?: string;
};

const RATE_LIMIT = { limit: 8, windowMs: 10 * 60 * 1000 };

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const rate = checkRateLimit(`square-pay:${ip}`, RATE_LIMIT);
    if (!rate.allowed) return rateLimitedResponse(rate.retryAfterSec);

    const raw = await readJsonBody(request);
    const parsed = bodySchema.safeParse(raw);
    if (!parsed.success || !isValidRef(parsed.data.ref)) {
      return jsonError(400, "Solicitud inválida.");
    }

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

    const variation = (data.source_payload?.variations ?? []).find(
      (row) => row.id === parsed.data.variationId && row.amount && row.amount > 0 && row.currency
    );
    if (!variation?.id || !variation.amount || !variation.currency) {
      return jsonError(400, "La opción de producto no es válida.");
    }

    const locationId = await getSquareLocationId();
    const payment = await createSquarePayment({
      sourceId: parsed.data.sourceId,
      idempotencyKey: parsed.data.idempotencyKey,
      amount: variation.amount,
      currency: variation.currency,
      locationId,
      note: `Thrive Formative · ${data.name}`,
      referenceId: parsed.data.ref,
    });

    if (payment.status !== "COMPLETED" && payment.status !== "APPROVED") {
      return jsonError(402, "El pago no se completó. Revisa la tarjeta e inténtalo de nuevo.");
    }

    return jsonOk({
      paymentId: payment.id,
      status: payment.status,
      receiptUrl: payment.receiptUrl,
    });
  } catch (error) {
    if (error instanceof PayloadTooLargeError) return payloadTooLargeResponse();
    if (error instanceof InvalidJsonError) return invalidJsonResponse();
    if (error instanceof SquareConfigError) {
      return jsonError(503, "El pago con tarjeta no está disponible en este momento.");
    }
    if (error instanceof SquareApiError) {
      const declined =
        error.code === "CARD_DECLINED" || error.code === "CVV_FAILURE" || error.code === "INVALID_EXPIRATION";
      return jsonError(
        error.status === 401 ? 502 : 402,
        declined
          ? "La tarjeta fue rechazada. Revisa los datos e inténtalo de nuevo."
          : "No se pudo completar el pago."
      );
    }
    return handleRouteError("square-payment", error);
  }
}
