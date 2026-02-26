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

export default function LoginPage() {
  const t = useTranslations("auth");
  const locale = useLocale();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    router.push(`/${locale}#citas`);
    router.refresh();
  }

  return (
    <ThemeProvider>
      <ThemeSwitcher />
      <Header />
      <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <h1 className="font-display text-3xl md:text-4xl tracking-wide mb-2">
            {t("loginTitle")}
          </h1>
          <p className="text-muted mb-8">
            {t("loginSubtitle")}
          </p>
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 text-sm">
                {error}
              </div>
            )}
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
                className="w-full rounded-xl border border-theme bg-surface px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary))]"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full rounded-xl px-4 py-3 text-base font-medium disabled:opacity-60"
            >
              {loading ? t("submitting") : t("submitLogin")}
            </button>
          </form>
          <p className="mt-6 text-center text-muted text-sm">
            {t("noAccount")}{" "}
            <Link href={`/${locale}/register`} className="text-[rgb(var(--primary))] hover:underline">
              {t("registerLink")}
            </Link>
          </p>
          <p className="mt-4 text-center">
            <Link href={`/${locale}`} className="text-sm text-muted hover:underline">
              {t("backHome")}
            </Link>
          </p>
        </div>
      </div>
    </ThemeProvider>
  );
}
