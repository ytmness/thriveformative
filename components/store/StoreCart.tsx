"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type CartLine = {
  ref: string;
  variationId: string;
  name: string;
  variationName: string;
  quantity: number;
  unitAmount: number;
  currency: string;
  imageUrl: string | null;
};

type ChargeState = {
  status: "loading" | "ready" | "unavailable";
  currency: string | null;
  environment: "sandbox" | "production" | null;
};

type StoreCartValue = ChargeState & {
  lines: CartLine[];
  count: number;
  add: (line: Omit<CartLine, "quantity">, quantity?: number) => void;
  setQuantity: (ref: string, variationId: string, quantity: number) => void;
  remove: (ref: string, variationId: string) => void;
  clear: () => void;
};

const STORAGE_KEY = "tf-store-cart-v1";
const StoreCartContext = createContext<StoreCartValue | null>(null);

function readStored(): CartLine[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CartLine[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (line) =>
        line &&
        typeof line.ref === "string" &&
        typeof line.variationId === "string" &&
        typeof line.name === "string" &&
        Number.isFinite(line.quantity) &&
        line.quantity > 0 &&
        Number.isFinite(line.unitAmount) &&
        typeof line.currency === "string"
    );
  } catch {
    return [];
  }
}

export function StoreCartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [charge, setCharge] = useState<ChargeState>({
    status: "loading",
    currency: null,
    environment: null,
  });

  useEffect(() => {
    setLines(readStored());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  }, [hydrated, lines]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/square/checkout-context")
      .then(async (response) => {
        const body = (await response.json()) as { ok?: boolean; currency?: string; environment?: "sandbox" | "production" };
        if (!response.ok || !body.ok || !body.currency) throw new Error("unavailable");
        return body;
      })
      .then((body) => {
        if (cancelled) return;
        setCharge({ status: "ready", currency: body.currency ?? null, environment: body.environment ?? null });
      })
      .catch(() => {
        if (!cancelled) setCharge({ status: "unavailable", currency: null, environment: null });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const add = useCallback((line: Omit<CartLine, "quantity">, quantity = 1) => {
    setLines((current) => {
      const index = current.findIndex((row) => row.ref === line.ref && row.variationId === line.variationId);
      if (index >= 0) {
        return current.map((row, i) =>
          i === index ? { ...row, ...line, quantity: Math.min(20, row.quantity + quantity) } : row
        );
      }
      return [...current, { ...line, quantity: Math.min(20, quantity) }];
    });
  }, []);

  const setQuantity = useCallback((ref: string, variationId: string, quantity: number) => {
    setLines((current) =>
      current.flatMap((row) => {
        if (row.ref !== ref || row.variationId !== variationId) return [row];
        if (quantity <= 0) return [];
        return [{ ...row, quantity: Math.min(20, quantity) }];
      })
    );
  }, []);

  const remove = useCallback((ref: string, variationId: string) => {
    setLines((current) => current.filter((row) => row.ref !== ref || row.variationId !== variationId));
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const count = lines.reduce((sum, line) => sum + line.quantity, 0);
  const value = useMemo<StoreCartValue>(
    () => ({ ...charge, lines: hydrated ? lines : [], count: hydrated ? count : 0, add, setQuantity, remove, clear }),
    [add, charge, clear, count, hydrated, lines, remove, setQuantity]
  );

  return <StoreCartContext.Provider value={value}>{children}</StoreCartContext.Provider>;
}

export function useStoreCart() {
  const value = useContext(StoreCartContext);
  if (!value) throw new Error("useStoreCart requiere StoreCartProvider.");
  return value;
}
