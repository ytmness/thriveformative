import { NextResponse } from "next/server";

export const GENERIC_ERROR = "No se pudo completar la solicitud. Inténtalo más tarde.";

export function jsonError(status: number, error = GENERIC_ERROR) {
  return NextResponse.json({ ok: false, error }, { status });
}

export function jsonOk<T extends Record<string, unknown>>(data?: T) {
  return NextResponse.json({ ok: true, ...data });
}

export function handleRouteError(scope: string, error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[${scope}]`, message);
  return jsonError(500);
}
