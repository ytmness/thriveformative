import type { NextRequest } from "next/server";
import { jsonError } from "@/lib/security/errors";

export const DEFAULT_MAX_JSON_BYTES = 16 * 1024;

export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;
  return "unknown";
}

export async function readJsonBody(
  request: NextRequest,
  maxBytes = DEFAULT_MAX_JSON_BYTES
): Promise<unknown> {
  const contentLength = request.headers.get("content-length");
  if (contentLength) {
    const len = Number.parseInt(contentLength, 10);
    if (Number.isFinite(len) && len > maxBytes) {
      throw new PayloadTooLargeError();
    }
  }

  const raw = await request.text();
  if (raw.length > maxBytes) {
    throw new PayloadTooLargeError();
  }
  if (!raw.trim()) return null;

  try {
    return JSON.parse(raw) as unknown;
  } catch {
    throw new InvalidJsonError();
  }
}

export class PayloadTooLargeError extends Error {
  constructor() {
    super("Payload too large");
    this.name = "PayloadTooLargeError";
  }
}

export class InvalidJsonError extends Error {
  constructor() {
    super("Invalid JSON");
    this.name = "InvalidJsonError";
  }
}

export function payloadTooLargeResponse() {
  return jsonError(413, "El mensaje es demasiado grande.");
}

export function invalidJsonResponse() {
  return jsonError(400, "Solicitud inválida.");
}

export function rateLimitedResponse(retryAfterSec: number) {
  const res = jsonError(429, "Demasiadas solicitudes. Espera un momento e inténtalo de nuevo.");
  res.headers.set("Retry-After", String(retryAfterSec));
  return res;
}
