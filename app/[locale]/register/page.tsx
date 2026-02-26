"use client";

import { useState } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const locale = useLocale();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error: err } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    setSuccess(true);
    router.refresh();
  }

  if (success) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-6">
        <div className="w-full max-w-md text-center">
          <h1 className="font-display text-3xl md:text-4xl tracking-wide mb-4">
            Revisa tu correo
          </h1>
          <p className="text-muted mb-8">
            Te enviamos un enlace para confirmar tu cuenta. Haz clic en el enlace y luego inicia sesión.
          </p>
          <Link
            href={`/${locale}/login`}
            className="btn-primary inline-block rounded-xl px-6 py-3"
          >
            Ir a iniciar sesión
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <h1 className="font-display text-3xl md:text-4xl tracking-wide mb-2">
          Crear cuenta
        </h1>
        <p className="text-muted mb-8">
          Regístrate para agendar y gestionar tus citas.
        </p>
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 text-sm">
              {error}
            </div>
          )}
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-muted mb-1.5">
              Nombre completo
            </label>
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="w-full rounded-xl border border-theme bg-surface px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary))]"
              placeholder="Tu nombre"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-muted mb-1.5">
              Correo
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-xl border border-theme bg-surface px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary))]"
              placeholder="tu@correo.com"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-muted mb-1.5">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full rounded-xl border border-theme bg-surface px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary))]"
              placeholder="Mínimo 6 caracteres"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full rounded-xl px-4 py-3 text-base font-medium disabled:opacity-60"
          >
            {loading ? "Creando cuenta…" : "Registrarme"}
          </button>
        </form>
        <p className="mt-6 text-center text-muted text-sm">
          ¿Ya tienes cuenta?{" "}
          <Link href={`/${locale}/login`} className="text-[rgb(var(--primary))] hover:underline">
            Inicia sesión
          </Link>
        </p>
        <p className="mt-4 text-center">
          <Link href={`/${locale}`} className="text-sm text-muted hover:underline">
            ← Volver al inicio
          </Link>
        </p>
      </div>
    </div>
  );
}
