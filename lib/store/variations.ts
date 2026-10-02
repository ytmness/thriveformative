import { majorToMinor } from "@/lib/square/money";

export type SellableVariation = {
  id: string;
  name: string;
  amount: number;
  currency: string;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function asPositive(value: unknown): number | null {
  const amount = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  if (!Number.isFinite(amount) || amount <= 0) return null;
  return amount;
}

function cleanName(value: unknown): string {
  const name = typeof value === "string" ? value.trim() : "";
  if (!name || name === "Default Title") return "Estándar";
  return name.slice(0, 120);
}

function squareVariations(payload: Record<string, unknown>): SellableVariation[] {
  if (!Array.isArray(payload.variations)) return [];
  const rows: SellableVariation[] = [];
  for (const entry of payload.variations) {
    const row = asRecord(entry);
    if (!row || typeof row.id !== "string" || !row.id) continue;
    const amount = asPositive(row.amount);
    const currency = typeof row.currency === "string" ? row.currency.trim().toUpperCase() : "";
    if (!amount || !currency) continue;
    rows.push({
      id: row.id,
      name: cleanName(row.name),
      amount: Math.round(amount),
      currency,
    });
  }
  return rows;
}

function catalogVariations(payload: Record<string, unknown>, currency: string): SellableVariation[] {
  if (!Array.isArray(payload.variants)) return [];
  const rows: SellableVariation[] = [];
  for (const entry of payload.variants) {
    const row = asRecord(entry);
    if (!row || row.id == null) continue;
    const major = asPositive(row.price);
    if (!major) continue;
    const id = String(row.id).trim();
    if (!id) continue;
    rows.push({
      id,
      name: cleanName(row.title),
      amount: majorToMinor(major, currency),
      currency,
    });
  }
  return rows;
}

export function sellableVariations(input: {
  source: string | null;
  sourcePayload: unknown;
  priceMin: unknown;
  currency: string | null;
}): SellableVariation[] {
  const payload = asRecord(input.sourcePayload);
  const currency = (input.currency || "USD").trim().toUpperCase();

  if (input.source === "square" && payload) {
    const square = squareVariations(payload);
    if (square.length) return square;
  }

  if (payload) {
    const catalog = catalogVariations(payload, currency);
    if (catalog.length) return catalog;
    const square = squareVariations(payload);
    if (square.length) return square;
  }

  const major = asPositive(input.priceMin);
  if (!major || !currency) return [];
  return [{ id: "default", name: "Estándar", amount: majorToMinor(major, currency), currency }];
}

export function posSku(country: string, ref: string, variationId: string): string {
  const variant = variationId.replace(/[^A-Za-z0-9_-]/g, "").slice(0, 48) || "default";
  return `tienda:${country}:${ref}:${variant}`.slice(0, 120);
}
