import { getSquareCredentials, squareApiBase } from "@/lib/square/config";

export const SQUARE_VERSION = "2026-09-16";

export class SquareApiError extends Error {
  status: number;
  code?: string;

  constructor(status: number, message: string, code?: string) {
    super(message);
    this.name = "SquareApiError";
    this.status = status;
    this.code = code;
  }
}

type SquareErrorBody = {
  errors?: { code?: string; detail?: string; category?: string }[];
};

export async function squareFetch<T>(
  path: string,
  init?: { method?: string; body?: unknown }
): Promise<T> {
  const credentials = getSquareCredentials();
  const response = await fetch(`${squareApiBase(credentials.environment)}${path}`, {
    method: init?.method ?? (init?.body === undefined ? "GET" : "POST"),
    headers: {
      Authorization: `Bearer ${credentials.accessToken}`,
      "Square-Version": SQUARE_VERSION,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: init?.body === undefined ? undefined : JSON.stringify(init.body),
    cache: "no-store",
  });

  const payload = (await response.json().catch(() => ({}))) as T & SquareErrorBody;
  if (!response.ok) {
    const first = payload.errors?.[0];
    throw new SquareApiError(
      response.status,
      first?.detail || first?.code || `Square respondió ${response.status}.`,
      first?.code
    );
  }
  return payload;
}

let cachedLocation: { environment: string; id: string; currency: string } | null = null;

export async function getSquareLocation(): Promise<{ id: string; currency: string }> {
  const credentials = getSquareCredentials();
  if (
    cachedLocation?.environment === credentials.environment &&
    (!credentials.locationId || cachedLocation.id === credentials.locationId)
  ) {
    return { id: cachedLocation.id, currency: cachedLocation.currency };
  }

  const body = await squareFetch<{
    locations?: { id?: string; status?: string; currency?: string }[];
  }>("/v2/locations");

  const rows = body.locations ?? [];
  const location = credentials.locationId
    ? rows.find((row) => row.id === credentials.locationId)
    : (rows.find((row) => row.status === "ACTIVE" && row.id && row.currency) ??
      rows.find((row) => row.id && row.currency));

  if (!location?.id || !location.currency) {
    throw new SquareApiError(404, "Square no devolvió una sede con moneda para este ambiente.");
  }

  cachedLocation = {
    environment: credentials.environment,
    id: location.id,
    currency: location.currency.toUpperCase(),
  };
  return { id: cachedLocation.id, currency: cachedLocation.currency };
}

export async function getSquareLocationId(): Promise<string> {
  const location = await getSquareLocation();
  return location.id;
}
