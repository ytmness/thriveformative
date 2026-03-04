"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useLocale } from "next-intl";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase";
import { useSearchParams, useRouter } from "next/navigation";
import ThemeProvider from "@/components/theme/ThemeProvider";
import ThemeSwitcher from "@/components/theme/ThemeSwitcher";
import Header from "@/components/Header";

export default function LoginPage() {
  const t = useTranslations("auth");
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [codeSent, setCodeSent] = useState(false);
  const [pendingEmail, setPendingEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    const err = searchParams.get("error");
    if (err) setError(decodeURIComponent(err));
  }, [searchParams]);

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
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
    setPendingEmail(email);
    setCodeSent(true);
  }

  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault();
    if (!pendingEmail || !otpCode.trim()) return;
    setError(null);
    setVerifying(true);
    const supabase = createClient();
    const redirectTo =
      typeof window !== "undefined"
        ? `${window.location.origin}/${locale}`
        : undefined;
    const { error: err } = await supabase.auth.verifyOtp({
      email: pendingEmail,
      token: otpCode.trim(),
      type: "email",
      options: redirectTo ? { redirectTo } : undefined,
    });
    setVerifying(false);
    if (err) {
      setError(t("invalidCode"));
      return;
    }
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();
      if (profile?.role === "admin") {
        router.push(`/${locale}/admin`);
        router.refresh();
        return;
      }
    }
    router.push(`/${locale}#citas`);
    router.refresh();
  }

  const formContent = !codeSent ? (
    <>
      <h1 className="font-display text-3xl md:text-4xl lg:text-5xl tracking-wide mb-3">
        {t("loginTitle")}
      </h1>
      <p className="text-muted mb-10 text-base md:text-lg">
        {t("loginSubtitle")}
      </p>
      <form onSubmit={handleSendCode} className="space-y-6">
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
          {loading ? t("submitting") : t("submitLogin")}
        </button>
      </form>
    </>
  ) : (
    <>
      <h1 className="font-display text-3xl md:text-4xl lg:text-5xl tracking-wide mb-3">
        {t("codeSentTitle")}
      </h1>
      <p className="text-muted mb-10 text-base md:text-lg">
        {t("codeSentText")}
      </p>
      <form onSubmit={handleVerifyCode} className="space-y-6">
        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 text-base">
            {error}
          </div>
        )}
        <div>
          <label htmlFor="otp" className="block text-base font-medium text-muted mb-2">
            {t("codeLabel")}
          </label>
          <input
            id="otp"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={8}
            value={otpCode}
            onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
            placeholder={t("codePlaceholder")}
            className="w-full rounded-xl border border-theme bg-surface px-5 py-4 text-base md:text-lg text-center tracking-[0.4em] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary))]"
          />
        </div>
        <button
          type="submit"
          disabled={verifying || otpCode.length !== 8}
          className="btn-primary w-full rounded-xl px-5 py-4 text-base md:text-lg font-medium disabled:opacity-60"
        >
          {verifying ? t("verifying") : t("verifyCode")}
        </button>
      </form>
      <button
        type="button"
        onClick={() => { setCodeSent(false); setOtpCode(""); setError(null); }}
        className="text-sm text-muted hover:underline mt-4"
      >
        ← {t("useAnotherEmail")}
      </button>
    </>
  );

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
            {formContent}
            <p className="mt-8 text-center md:text-left text-muted text-base">
              {t("noAccount")}{" "}
              <Link href={`/${locale}/register`} className="text-[rgb(var(--primary))] hover:underline">
                {t("registerLink")}
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
