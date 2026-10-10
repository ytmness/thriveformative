"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";

type SiteUser = { id: string; email: string };

export function useUser() {
  const [user, setUser] = useState<SiteUser | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        if (!cancelled) setUser({ id: session.user.id, email: session.user.email || "" });
        const { data } = await supabase.from("profiles").select("role").eq("id", session.user.id).maybeSingle();
        if (!cancelled) {
          setRole(data?.role ?? "client");
          setLoading(false);
        }
        return;
      }
      try {
        const response = await fetch("/api/admin/me", { credentials: "same-origin" });
        const body = (await response.json()) as { authenticated?: boolean };
        if (!cancelled) {
          if (body.authenticated) {
            setUser({ id: "admin", email: "admin" });
            setRole("admin");
          } else {
            setUser(null);
            setRole(null);
          }
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
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      load();
    });
    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  return { user, role, loading };
}

export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
  await fetch("/api/admin/logout", { method: "POST", credentials: "same-origin" });
}
