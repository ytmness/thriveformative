const ZERO_DECIMAL = new Set(["JPY", "KRW", "VND", "CLP"]);

export function minorToMajor(amount: number, currency: string): number {
  if (ZERO_DECIMAL.has(currency.toUpperCase())) return amount;
  return amount / 100;
}

export function majorToMinor(amount: number, currency: string): number {
  if (!Number.isFinite(amount) || amount <= 0) return 0;
  if (ZERO_DECIMAL.has(currency.toUpperCase())) return Math.round(amount);
  return Math.round(amount * 100);
}

export function readSquareMoney(money?: {
  amount?: number | string;
  currency?: string;
}): { amount: number; currency: string } | null {
  if (!money?.currency || money.amount == null) return null;
  const amount = typeof money.amount === "string" ? Number(money.amount) : money.amount;
  if (!Number.isFinite(amount) || amount <= 0) return null;
  return { amount: Math.round(amount), currency: money.currency.toUpperCase() };
}
