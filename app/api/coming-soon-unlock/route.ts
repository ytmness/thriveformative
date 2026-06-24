import { NextRequest, NextResponse } from "next/server";
import { getComingSoonPassword } from "@/lib/env/server";
import { log } from "@/lib/log";
import { checkRateLimit } from "@/lib/rate-limit/memory";
import { handleRouteError, jsonError, jsonOk } from "@/lib/security/errors";
import {
  getClientIp,
  invalidJsonResponse,
  InvalidJsonError,
  PayloadTooLargeError,
  payloadTooLargeResponse,
  rateLimitedResponse,
  readJsonBody,
} from "@/lib/security/request";
import { comingSoonUnlockSchema } from "@/lib/validation/schemas";

const COOKIE_NAME = "thrive_unlock";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;
const RATE_LIMIT = { limit: 8, windowMs: 15 * 60 * 1000 };

export async function POST(request: NextRequest) {
  const scope = "coming-soon-unlock";

  try {
    const ip = getClientIp(request);
    const rate = checkRateLimit(`coming-soon:${ip}`, RATE_LIMIT);
    if (!rate.allowed) {
      return rateLimitedResponse(rate.retryAfterSec);
    }

    const raw = await readJsonBody(request, 4 * 1024);
    const parsed = comingSoonUnlockSchema.safeParse(raw);
    if (!parsed.success) {
      return jsonError(400, "Solicitud inválida.");
    }

    const expected = getComingSoonPassword();
    if (!expected) {
      log.warn(scope, "COMING_SOON_PASSWORD no configurado");
      return jsonError(500, "Acceso no configurado");
    }

    if (parsed.data.password !== expected) {
      return jsonError(401, "Contraseña incorrecta");
    }

    const res = jsonOk();
    res.cookies.set(COOKIE_NAME, "1", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: COOKIE_MAX_AGE,
    });
    return res;
  } catch (error) {
    if (error instanceof PayloadTooLargeError) return payloadTooLargeResponse();
    if (error instanceof InvalidJsonError) return invalidJsonResponse();
    return handleRouteError(scope, error);
  }
}
