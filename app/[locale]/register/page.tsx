"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useLocale } from "next-intl";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase";
import ThemeProvider from "@/components/theme/ThemeProvider";
import ThemeSwitcher from "@/components/theme/ThemeSwitcher";
import Header from "@/components/Header";

export default function RegisterPage() {
  const t = useTranslations("auth");
  const locale = useLocale();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [linkSent, setLinkSent] = useState(false);
  const cooldownUntil = useRef<number>(0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (Date.now() < cooldownUntil.current) return;
    setError(null);
    setLoading(true);
    cooldownUntil.current = Date.now() + 60_000;
    const supabase = createClient();
    const { error: err } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: `${typeof window !== "undefined" ? window.location.origin : ""}/auth/callback`,
      },
    });
    setLoading(false);
    if (err) {
      const status = (err as { status?: number }).status;
      setError(status === 429 ? t("rateLimit") : err.message);
      return;
    }
    setLinkSent(true);
  }

  return (
    <ThemeProvider>
      <ThemeSwitcher />
      <Header />
      <div className="min-h-[calc(100vh-5rem)] flex flex-col md:flex-row relative">
        <div className="register-bg-half" aria-hidden />
        <motion.div
          initial={{ opacity: 0, x: -48 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="flex-1 flex items-center justify-center md:justify-end px-6 py-12 md:pr-96 md:pl-8 relative z-10"
        >
          <div className="w-full max-w-md md:max-w-lg">
            <h1 className="font-display text-3xl md:text-4xl lg:text-5xl tracking-wide mb-3">
              {linkSent ? t("magicLinkSentTitle") : t("registerTitle")}
            </h1>
            <p className="text-muted mb-10 text-base md:text-lg">
              {linkSent ? t("magicLinkSentText") : t("registerSubtitle")}
            </p>
            {!linkSent ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 text-base">
                    {error}
                  </div>
                )}
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
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full rounded-xl px-5 py-4 text-base md:text-lg font-medium disabled:opacity-60"
                >
                  {loading ? t("submittingRegister") : t("submitRegister")}
                </button>
              </form>
            ) : (
              <>
                <p className="text-muted text-base mb-6">{t("magicLinkHint")}</p>
                <button
                  type="button"
                  onClick={() => { setLinkSent(false); setError(null); }}
                  className="text-sm text-muted hover:underline"
                >
                  ← {t("useAnotherEmail")}
                </button>
              </>
            )}
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
