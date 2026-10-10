"use client";

import { useEffect, useState } from "react";

type SiteUser = { id: string; email: string; name?: string };

const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

export function useUser() {
  const [user, setUser] = useState<SiteUser | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await fetch("/api/auth/me", { credentials: "same-origin" });
        const body = (await response.json()) as { user?: SiteUser | null };
        if (!cancelled) {
          setUser(body.user?.id ? body.user : null);
          setRole(body.user?.id ? "client" : null);
        }
      } catch {
        if (!cancelled) {
          setUser(null);
          setRole(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    listeners.add(load);
    return () => {
      cancelled = true;
      listeners.delete(load);
    };
  }, []);

  return { user, role, loading };
}

export async function signOut() {
  await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" });
  notify();
}
