import { NextResponse } from "next/server";
import { log } from "@/lib/log";

export class DomainError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export function apiError(status: number, error: string) {
  return NextResponse.json({ error }, { status });
}

export function isPgError(error: unknown, code: string): boolean {
  return typeof error === "object" && error !== null && "code" in error && (error as { code: string }).code === code;
}

export function toErrorResponse(error: unknown) {
  if (error instanceof DomainError) return apiError(error.status, error.message);
  if (isPgError(error, "23P01")) return apiError(409, "Ese horario ya está ocupado.");
  if (isPgError(error, "23505")) return apiError(409, "Ya existe un registro con esos datos.");
  if (isPgError(error, "23503")) return apiError(409, "No se puede completar porque hay datos relacionados.");
  if (isPgError(error, "22P02")) return apiError(400, "Hay un dato con formato incorrecto. Revisa números, fechas y listas.");
  const code =
    typeof error === "object" && error && "code" in error ? String((error as { code: unknown }).code) : "";
  log.error("api", "operación fallida", { code: code || (error instanceof Error ? error.name : "error") });
  return apiError(500, "No se pudo completar la operación.");
}

export function pageParams(url: URL) {
  const page = Math.max(1, Number(url.searchParams.get("page") || "1") || 1);
  const pageSize = Math.min(100, Math.max(1, Number(url.searchParams.get("pageSize") || "25") || 25));
  return { page, pageSize, offset: (page - 1) * pageSize };
}

export function requestMeta(req: Request) {
  const forwarded = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return {
    ip: forwarded || req.headers.get("x-real-ip") || null,
    userAgent: req.headers.get("user-agent"),
  };
}

export function asString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed || null;
}

export function asBool(value: unknown, fallback = false): boolean {
  if (typeof value === "boolean") return value;
  return fallback;
}

export function asNumber(value: unknown, fallback = 0): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function money(value: number): number {
  return Math.round(value * 100) / 100;
}

export async function readJson(req: Request): Promise<Record<string, unknown>> {
  const body = (await req.json().catch(() => null)) as unknown;
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new DomainError("Solicitud inválida.");
  }
  return body as Record<string, unknown>;
}
