"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
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
        {/* Formulario encima del fondo: animación de izquierda a derecha */}
        <motion.div
          initial={{ opacity: 0, x: -48 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="flex-1 flex items-center justify-center md:justify-end px-6 py-12 md:pr-96 md:pl-8 relative z-10"
        >
          <div className="w-full max-w-md md:max-w-lg">
            <h1 className="font-display text-3xl md:text-4xl lg:text-5xl tracking-wide mb-3">
              {t("registerTitle")}
            </h1>
            <p className="text-muted mb-10 text-base md:text-lg">
              {t("registerSubtitle")}
            </p>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 text-base">
                  {error}
                </div>
              )}
              <div>
                <label htmlFor="fullName" className="block text-base font-medium text-muted mb-2">
                  {t("fullName")}
                </label>
                <input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="w-full rounded-xl border border-theme bg-surface px-5 py-4 text-base md:text-lg focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary))]"
                  placeholder={t("fullNamePlaceholder")}
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-base font-medium text-muted mb-2">
                  {t("email")}
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full rounded-xl border border-theme bg-surface px-5 py-4 text-base md:text-lg focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary))]"
                  placeholder={t("emailPlaceholder")}
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-base font-medium text-muted mb-2">
                  {t("password")}
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full rounded-xl border border-theme bg-surface px-5 py-4 text-base md:text-lg focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary))]"
                  placeholder={t("passwordMin")}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full rounded-xl px-5 py-4 text-base md:text-lg font-medium disabled:opacity-60"
              >
                {loading ? t("submittingRegister") : t("submitRegister")}
              </button>
            </form>
            <p className="mt-8 text-center md:text-left text-muted text-base">
              {t("hasAccount")}{" "}
              <Link href={`/${locale}/login`} className="text-[rgb(var(--primary))] hover:underline">
                {t("loginLink")}
              </Link>
            </p>
            <p className="mt-5 text-center md:text-left">
              <Link href={`/${locale}`} className="text-base text-muted hover:underline">
                {t("backHome")}
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </ThemeProvider>
  );
}
