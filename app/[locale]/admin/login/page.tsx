"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ThemeProvider from "@/components/theme/ThemeProvider";
import BrandCtaButton from "@/components/ui/BrandCtaButton";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [ticket, setTicket] = useState<string | null>(null);
  const [code, setCode] = useState("");
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
        body: JSON.stringify(ticket ? { ticket, code } : { email, password }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((body as { error?: string }).error || "No se pudo iniciar sesión");
        return;
      }
      if ((body as { mfaRequired?: boolean }).mfaRequired) {
        setTicket((body as { ticket: string }).ticket);
        return;
      }
      router.replace("/admin");
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
        <form onSubmit={onSubmit} className="w-full max-w-md rounded-2xl border border-theme bg-surface p-8 shadow-soft">
          <h1 className="font-display text-2xl mb-2">Equipo Thrive</h1>
          <p className="type-ui-muted text-sm mb-6">Acceso de administración, medicina y recepción.</p>
          {ticket ? (
            <label className="block text-sm font-medium mb-2" htmlFor="admin-code">Código de verificación
              <input id="admin-code" inputMode="numeric" value={code} onChange={(e) => setCode(e.target.value)} className="w-full rounded-xl border border-theme bg-bg px-4 py-3 mt-2" required />
            </label>
          ) : (
            <>
              <label className="block text-sm font-medium mb-2" htmlFor="admin-email">Correo
                <input id="admin-email" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-xl border border-theme bg-bg px-4 py-3 mt-2 mb-4" required />
              </label>
              <label className="block text-sm font-medium mb-2" htmlFor="admin-pass">Contraseña
                <input id="admin-pass" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-xl border border-theme bg-bg px-4 py-3 mt-2 mb-4" required />
              </label>
            </>
          )}
          {error ? <p className="text-sm text-red-600 mb-3" role="alert">{error}</p> : null}
          <BrandCtaButton type="submit" disabled={loading} block>{loading ? "Entrando…" : "Entrar"}</BrandCtaButton>
        </form>
      </main>
    </ThemeProvider>
  );
}
