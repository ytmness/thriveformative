"use client";

import { useState } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import ThemeProvider from "@/components/theme/ThemeProvider";
import ThemeSwitcher from "@/components/theme/ThemeSwitcher";
import Header from "@/components/Header";

export default function RegisterPage() {
  const t = useTranslations("auth");
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
      <ThemeProvider>
        <ThemeSwitcher />
        <Header />
        <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-md text-center">
            <h1 className="font-display text-3xl md:text-4xl tracking-wide mb-4">
              {t("successTitle")}
            </h1>
            <p className="text-muted mb-8">
              {t("successText")}
            </p>
            <Link
              href={`/${locale}/login`}
              className="btn-primary inline-block rounded-xl px-6 py-3"
            >
              {t("goToLogin")}
            </Link>
          </div>
        </div>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <ThemeSwitcher />
      <Header />
      <div className="min-h-[calc(100vh-5rem)] flex flex-col md:flex-row relative">
        {/* Capa de fondo: logo gigante al revés, de izquierda hacia el centro, sin cortar; no afecta al texto */}
        <div className="register-bg-half" aria-hidden />
        {/* Formulario encima del fondo */}
        <div className="flex-1 flex items-center justify-center md:justify-end px-6 py-12 md:pr-16 md:pl-10 relative z-10">
          <div className="w-full max-w-md">
            <h1 className="font-display text-3xl md:text-4xl tracking-wide mb-2">
              {t("registerTitle")}
            </h1>
            <p className="text-muted mb-8">
              {t("registerSubtitle")}
            </p>
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 text-sm">
                  {error}
                </div>
              )}
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-muted mb-1.5">
                  {t("fullName")}
                </label>
                <input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="w-full rounded-xl border border-theme bg-surface px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary))]"
                  placeholder={t("fullNamePlaceholder")}
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-muted mb-1.5">
                  {t("email")}
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full rounded-xl border border-theme bg-surface px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary))]"
                  placeholder={t("emailPlaceholder")}
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-muted mb-1.5">
                  {t("password")}
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full rounded-xl border border-theme bg-surface px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary))]"
                  placeholder={t("passwordMin")}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full rounded-xl px-4 py-3 text-base font-medium disabled:opacity-60"
              >
                {loading ? t("submittingRegister") : t("submitRegister")}
              </button>
            </form>
            <p className="mt-6 text-center md:text-left text-muted text-sm">
              {t("hasAccount")}{" "}
              <Link href={`/${locale}/login`} className="text-[rgb(var(--primary))] hover:underline">
                {t("loginLink")}
              </Link>
            </p>
            <p className="mt-4 text-center md:text-left">
              <Link href={`/${locale}`} className="text-sm text-muted hover:underline">
                {t("backHome")}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </ThemeProvider>
  );
}
