import { NextRequest } from "next/server";
import { z } from "zod";
import { currentPatient } from "@/lib/auth/patientAccess";
import { listPublicMemberships } from "@/lib/domain/memberships";
import { subscribePublic } from "@/lib/domain/membershipCheckout";
import { DomainError, toErrorResponse } from "@/lib/http";
import { checkRateLimit } from "@/lib/rate-limit/memory";
import { jsonError, jsonOk, handleRouteError } from "@/lib/security/errors";
import {
  getClientIp,
  InvalidJsonError,
  invalidJsonResponse,
  PayloadTooLargeError,
  payloadTooLargeResponse,
  rateLimitedResponse,
  readJsonBody,
} from "@/lib/security/request";
import { getSquareLocation, SquareApiError } from "@/lib/square/client";
import { SquareConfigError } from "@/lib/square/config";
import { requestMarket } from "@/lib/site/requestMarket";

const bodySchema = z.object({
  membershipId: z.string().uuid(),
  sourceId: z.string().min(1).max(512),
  idempotencyKey: z.string().uuid(),
});

export async function GET() {
  try {
    const market = await requestMarket();
    const location = await getSquareLocation().catch(() => null);
    return jsonOk({
      currency: location?.currency || "USD",
      plans: await listPublicMemberships(market),
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const patient = await currentPatient().catch(() => null);
    if (!patient) return jsonError(401, "Regístrate para suscribirte.");

    const ip = getClientIp(request);
    const rate = checkRateLimit(`membership-pay:${ip}`, { limit: 8, windowMs: 10 * 60 * 1000 });
    if (!rate.allowed) return rateLimitedResponse(rate.retryAfterSec);

    const raw = await readJsonBody(request);
    const parsed = bodySchema.safeParse(raw);
    if (!parsed.success) return jsonError(400, "Solicitud inválida.");

    return jsonOk(await subscribePublic(parsed.data));
  } catch (error) {
    if (error instanceof DomainError) return toErrorResponse(error);
    if (error instanceof InvalidJsonError) return invalidJsonResponse();
    if (error instanceof PayloadTooLargeError) return payloadTooLargeResponse();
    if (error instanceof SquareConfigError) {
      return jsonError(503, "El pago con tarjeta no está disponible en este momento.");
    }
    if (error instanceof SquareApiError) {
      return jsonError(502, error.message || "No se pudo cobrar con Square.");
    }
    return handleRouteError("membership-subscribe", error);
  }
}
