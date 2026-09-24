"use client";

import { useEffect, useState } from "react";

/** Admin session (cookie) — patients use Pabau, not site accounts. */
export function useUser() {
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/me", { credentials: "same-origin" })
      .then((r) => r.json())
      .then((body: { authenticated?: boolean }) => {
        if (!cancelled) {
          setRole(body.authenticated ? "admin" : null);
        }
      })
      .catch(() => {
        if (!cancelled) setRole(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return {
    user: role === "admin" ? ({ id: "admin", email: "admin" } as { id: string; email: string }) : null,
    role,
    loading,
  };
}

export async function signOut() {
  await fetch("/api/admin/logout", { method: "POST", credentials: "same-origin" });
}
