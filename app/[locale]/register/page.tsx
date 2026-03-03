"use client";

import { useState, useRef } from "react";
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
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [birthDate, setBirthDate] = useState(""); // YYYY-MM-DD
  const [age, setAge] = useState<string>("");
  const [contactPreference, setContactPreference] = useState<
    "email" | "call" | "whatsapp" | ""
  >("");
  const [address, setAddress] = useState("");
  const [sex, setSex] = useState<"female" | "male" | "other" | "" >("");
  const [referralSource, setReferralSource] = useState<
    | "website"
    | "doctor"
    | "friend_family"
    | "social_media"
    | "ads_meta_tiktok"
    | "ads_google"
    | "other"
    | ""
  >("");
  const [referralOther, setReferralOther] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [codeSent, setCodeSent] = useState(false);
  const [pendingEmail, setPendingEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const cooldownUntil = useRef<number>(0);

  function computeAgeFromBirthDate(iso: string) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
    if (!m) return "";
    const y = Number(m[1]);
    const mo = Number(m[2]) - 1;
    const d = Number(m[3]);
    const dob = new Date(y, mo, d);
    if (Number.isNaN(dob.getTime())) return "";
    const today = new Date();
    let years = today.getFullYear() - dob.getFullYear();
    const hasHadBirthdayThisYear =
      today.getMonth() > dob.getMonth() ||
      (today.getMonth() === dob.getMonth() && today.getDate() >= dob.getDate());
    if (!hasHadBirthdayThisYear) years -= 1;
    return years >= 0 && years <= 130 ? String(years) : "";
  }

  async function handleSendCode(e: React.FormEvent) {
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

    // Guardar datos extra del registro en profiles
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user?.id) {
      const parsedAge = age.trim() ? Number(age) : null;
      const safeAge =
        parsedAge !== null && Number.isFinite(parsedAge) ? parsedAge : null;
      await supabase.from("profiles").upsert(
        {
          id: user.id,
          full_name: fullName.trim() || null,
          phone: phone.trim() || null,
          birth_date: birthDate || null,
          age: safeAge,
          contact_preference: contactPreference || null,
          address: address.trim() || null,
          sex: sex || null,
          referral_source: referralSource || null,
          referral_source_other:
            referralSource === "other" ? referralOther.trim() || null : null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      );
    }

    router.push(`/${locale}#citas`);
    router.refresh();
  }

  const formContent = !codeSent ? (
    <>
      <h1 className="font-display text-3xl md:text-4xl lg:text-5xl tracking-wide mb-3">
        {t("registerTitle")}
      </h1>
      <p className="text-muted mb-10 text-base md:text-lg">
        {t("registerSubtitle")}
      </p>
      <form onSubmit={handleSendCode} className="space-y-6">
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
          <label htmlFor="phone" className="block text-base font-medium text-muted mb-2">
            {t("phone")}
          </label>
          <input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full rounded-xl border border-theme bg-surface px-5 py-4 text-base md:text-lg focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary))]"
            placeholder={t("phonePlaceholder")}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="birthDate" className="block text-base font-medium text-muted mb-2">
              {t("birthDate")}
            </label>
            <input
              id="birthDate"
              type="date"
              value={birthDate}
              onChange={(e) => {
                const v = e.target.value;
                setBirthDate(v);
                const computed = computeAgeFromBirthDate(v);
                if (computed) setAge(computed);
              }}
              className="w-full rounded-xl border border-theme bg-surface px-5 py-4 text-base md:text-lg focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary))]"
            />
          </div>
          <div>
            <label htmlFor="age" className="block text-base font-medium text-muted mb-2">
              {t("age")}
            </label>
            <input
              id="age"
              type="number"
              min={0}
              max={130}
              value={age}
              onChange={(e) => setAge(e.target.value)}
              className="w-full rounded-xl border border-theme bg-surface px-5 py-4 text-base md:text-lg focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary))]"
              placeholder={t("agePlaceholder")}
            />
          </div>
        </div>
        <div>
          <label htmlFor="contactPreference" className="block text-base font-medium text-muted mb-2">
            {t("contactPreference")}
          </label>
          <select
            id="contactPreference"
            value={contactPreference}
            onChange={(e) => setContactPreference(e.target.value as typeof contactPreference)}
            className="w-full rounded-xl border border-theme bg-surface px-5 py-4 text-base md:text-lg focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary))]"
          >
            <option value="">{t("selectOption")}</option>
            <option value="email">{t("contactEmail")}</option>
            <option value="call">{t("contactCall")}</option>
            <option value="whatsapp">{t("contactWhatsapp")}</option>
          </select>
        </div>
        <div>
          <label htmlFor="address" className="block text-base font-medium text-muted mb-2">
            {t("address")}
          </label>
          <input
            id="address"
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full rounded-xl border border-theme bg-surface px-5 py-4 text-base md:text-lg focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary))]"
            placeholder={t("addressPlaceholder")}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="sex" className="block text-base font-medium text-muted mb-2">
              {t("sex")}
            </label>
            <select
              id="sex"
              value={sex}
              onChange={(e) => setSex(e.target.value as typeof sex)}
              className="w-full rounded-xl border border-theme bg-surface px-5 py-4 text-base md:text-lg focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary))]"
            >
              <option value="">{t("selectOption")}</option>
              <option value="female">{t("sexFemale")}</option>
              <option value="male">{t("sexMale")}</option>
              <option value="other">{t("sexOther")}</option>
            </select>
          </div>
          <div>
            <label htmlFor="referralSource" className="block text-base font-medium text-muted mb-2">
              {t("referralSource")}
            </label>
            <select
              id="referralSource"
              value={referralSource}
              onChange={(e) => setReferralSource(e.target.value as typeof referralSource)}
              className="w-full rounded-xl border border-theme bg-surface px-5 py-4 text-base md:text-lg focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary))]"
            >
              <option value="">{t("selectOption")}</option>
              <option value="website">{t("refWebsite")}</option>
              <option value="doctor">{t("refDoctor")}</option>
              <option value="friend_family">{t("refFriendFamily")}</option>
              <option value="social_media">{t("refSocial")}</option>
              <option value="ads_meta_tiktok">{t("refAdsMetaTiktok")}</option>
              <option value="ads_google">{t("refAdsGoogle")}</option>
              <option value="other">{t("refOther")}</option>
            </select>
          </div>
        </div>
        {referralSource === "other" && (
          <div>
            <label htmlFor="referralOther" className="block text-base font-medium text-muted mb-2">
              {t("refOtherLabel")}
            </label>
            <input
              id="referralOther"
              type="text"
              value={referralOther}
              onChange={(e) => setReferralOther(e.target.value)}
              className="w-full rounded-xl border border-theme bg-surface px-5 py-4 text-base md:text-lg focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary))]"
              placeholder={t("refOtherPlaceholder")}
            />
          </div>
        )}
        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full rounded-xl px-5 py-4 text-base md:text-lg font-medium disabled:opacity-60"
        >
          {loading ? t("submittingRegister") : t("submitRegister")}
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
