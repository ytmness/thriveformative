import { NextRequest } from "next/server";
import { sendEmailPayload, type EmailKind } from "@/lib/emailServer";
import { requireNotifyEmail } from "@/lib/env/server";
import { log } from "@/lib/log";
import { checkRateLimit } from "@/lib/rate-limit/memory";
import { GENERIC_ERROR, handleRouteError, jsonError, jsonOk } from "@/lib/security/errors";
import {
  getClientIp,
  invalidJsonResponse,
  InvalidJsonError,
  PayloadTooLargeError,
  payloadTooLargeResponse,
  rateLimitedResponse,
  readJsonBody,
} from "@/lib/security/request";
import { sendEmailBodySchema } from "@/lib/validation/schemas";

const RATE_LIMIT = { limit: 10, windowMs: 15 * 60 * 1000 };

/**
 * Contact confirmation / admin notify emails.
 * Appointment email kinds are retired (patients book in Pabau).
 */
export async function POST(request: NextRequest) {
  const scope = "send-email";

  try {
    const ip = getClientIp(request);
    const rate = checkRateLimit(`send-email:${ip}`, RATE_LIMIT);
    if (!rate.allowed) {
      return rateLimitedResponse(rate.retryAfterSec);
    }

    const raw = await readJsonBody(request);
    const parsed = sendEmailBodySchema.safeParse(raw);
    if (!parsed.success) {
      return jsonError(400, "Solicitud inválida.");
    }

    const body = parsed.data;
    if (body.website?.trim()) {
      return jsonOk();
    }

    let payload: EmailKind;

    switch (body.kind) {
      case "appointment_pending":
      case "appointment_confirmed":
      case "appointment_cancelled":
        return jsonError(
          410,
          "Las citas se gestionan en Pabau; este endpoint ya no envía emails de citas."
        );
      case "contact_confirmation": {
        payload = {
          kind: body.kind,
          to: body.email,
          name: body.name,
        };
        break;
      }
      case "contact_notify_admin": {
        payload = {
          kind: body.kind,
          to: requireNotifyEmail(),
          name: body.name,
          email: body.email,
          subject: body.subject ?? null,
          message: body.message,
        };
        break;
      }
      default:
        return jsonError(400, "Tipo de email no válido.");
    }

    const result = await sendEmailPayload(payload);
    if (!result.ok) {
      log.warn(scope, "send failed", { kind: body.kind });
      return jsonError(500, GENERIC_ERROR);
    }

    log.info(scope, "sent", { kind: body.kind });
    return jsonOk();
  } catch (error) {
    if (error instanceof PayloadTooLargeError) return payloadTooLargeResponse();
    if (error instanceof InvalidJsonError) return invalidJsonResponse();
    return handleRouteError(scope, error);
  }
}
