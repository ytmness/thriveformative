"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import ThemeProvider from "@/components/theme/ThemeProvider";
import BrandCtaButton from "@/components/ui/BrandCtaButton";

export default function AdminLoginPage() {
  const locale = useLocale();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ password }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((body as { error?: string }).error || "No se pudo iniciar sesión");
        return;
      }
      router.replace(`/${locale}/admin`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ThemeProvider>
      <main className="min-h-screen flex items-center justify-center px-4">
        <form
          onSubmit={onSubmit}
          className="w-full max-w-md rounded-2xl border border-theme bg-surface p-8 shadow-soft"
        >
          <h1 className="font-display text-2xl mb-2">Admin</h1>
          <p className="type-ui-muted text-sm mb-6">
            Acceso del equipo. Los pacientes agendan en Pabau.
          </p>
          <label className="block text-sm font-medium mb-2" htmlFor="admin-pass">
            Contraseña
          </label>
          <input
            id="admin-pass"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-theme bg-bg px-4 py-3 mb-4"
            required
          />
          {error ? (
            <p className="text-sm text-red-600 mb-3" role="alert">
              {error}
            </p>
          ) : null}
          <BrandCtaButton type="submit" disabled={loading} block>
            {loading ? "Entrando…" : "Entrar"}
          </BrandCtaButton>
        </form>
      </main>
    </ThemeProvider>
  );
}
