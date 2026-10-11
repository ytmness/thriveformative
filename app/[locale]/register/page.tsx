"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useLocale } from "next-intl";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { CALLING_CODES, withCallingCode } from "@/lib/phone/callingCodes";
import { readMarket, type SiteMarket } from "@/lib/site/market";
import ThemeProvider from "@/components/theme/ThemeProvider";
import ThemeSwitcher from "@/components/theme/ThemeSwitcher";
import Header from "@/components/Header";

const fieldClass = "w-full rounded-xl border border-theme bg-surface px-5 py-4 text-base md:text-lg focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary))]";

function composeBirth(year: string, month: string, day: string) {
  if (!year || !month || !day) return "";
  const y = Number(year);
  const m = Number(month);
  const d = Number(day);
  const date = new Date(y, m - 1, d);
  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) return "";
  return `${String(y).padStart(4, "0")}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function daysInMonth(year: string, month: string) {
  const m = Number(month);
  if (!m) return 31;
  const y = Number(year) || 2000;
  return new Date(y, m, 0).getDate();
}

function PhoneField({
  id,
  label,
  countryLabel,
  locale,
  country,
  onCountry,
  value,
  onChange,
  placeholder,
}: {
  id: string;
  label: string;
  countryLabel: string;
  locale: string;
  country: string;
  onCountry: (iso: string) => void;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  const options = useMemo(() => {
    const names = new Intl.DisplayNames([locale], { type: "region" });
    return Object.keys(CALLING_CODES)
      .map((iso) => ({ iso, dial: CALLING_CODES[iso], name: names.of(iso) || iso }))
      .sort((a, b) => a.name.localeCompare(b.name, locale));
  }, [locale]);

  return (
    <div>
      <label htmlFor={id} className="block text-base font-medium text-muted mb-2">
        {label}
      </label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <select
          aria-label={countryLabel}
          value={country}
          onChange={(e) => onCountry(e.target.value)}
          className={`${fieldClass} sm:max-w-[16rem]`}
        >
          {options.map((option) => (
            <option key={option.iso} value={option.iso}>
              +{option.dial} {option.name}
            </option>
          ))}
        </select>
        <input
          id={id}
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`${fieldClass} min-w-0 flex-1`}
          placeholder={placeholder}
        />
      </div>
    </div>
  );
}

export default function RegisterPage() {
  const t = useTranslations("auth");
  const locale = useLocale();
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [paternalSurname, setPaternalSurname] = useState("");
  const [maternalSurname, setMaternalSurname] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneCountry, setPhoneCountry] = useState("MX");
  const [birthDay, setBirthDay] = useState("");
  const [birthMonth, setBirthMonth] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [age, setAge] = useState<string>("");
  const [contactPreference, setContactPreference] = useState<
    "email" | "call" | "whatsapp" | ""
  >("");
  const [market, setMarket] = useState<SiteMarket>("MX");
  const usAddress = market === "US" || locale === "en";
  const [street, setStreet] = useState("");
  const [streetNumber, setStreetNumber] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [city, setCity] = useState("");
  const [region, setRegion] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [sex, setSex] = useState<"female" | "male" | "other" | "prefer_not" | "">("");
  const [sexDetail, setSexDetail] = useState("");
  const [emergencyName, setEmergencyName] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");
  const [emergencyCountry, setEmergencyCountry] = useState("MX");
  const [emergencyRelation, setEmergencyRelation] = useState("");
  const [policyRead, setPolicyRead] = useState(false);
  const [acceptedPolicies, setAcceptedPolicies] = useState(false);
  const policyRef = useRef<HTMLDivElement>(null);
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

  useEffect(() => {
    const next = readMarket();
    setMarket(next);
    const iso = next === "US" || locale === "en" ? "US" : "MX";
    setPhoneCountry(iso);
    setEmergencyCountry(iso);
  }, [locale]);

  useEffect(() => {
    const box = policyRef.current;
    if (box && box.scrollHeight <= box.clientHeight + 12) setPolicyRead(true);
  }, [locale, market]);

  function markPolicyRead(target: HTMLDivElement) {
    if (target.scrollTop + target.clientHeight >= target.scrollHeight - 12) setPolicyRead(true);
  }

  const birthIso = composeBirth(birthYear, birthMonth, birthDay);

  useEffect(() => {
    const max = daysInMonth(birthYear, birthMonth);
    if (birthDay && Number(birthDay) > max) setBirthDay(String(max));
  }, [birthYear, birthMonth, birthDay]);

  useEffect(() => {
    if (!birthIso) return;
    const computed = computeAgeFromBirthDate(birthIso);
    if (computed) setAge(computed);
  }, [birthIso]);

  function profilePayload() {
    const us = usAddress;
    return {
      email: email.trim(),
      firstName: firstName.trim() || null,
      middleName: middleName.trim() || null,
      paternalSurname: paternalSurname.trim() || null,
      maternalSurname: usAddress ? null : maternalSurname.trim() || null,
      phone: withCallingCode(phone, phoneCountry),
      birthDate: birthIso || null,
      age: age.trim() || null,
      contactPreference: contactPreference || null,
      street: street.trim() || null,
      streetNumber: streetNumber.trim() || null,
      neighborhood: usAddress ? null : neighborhood.trim() || null,
      city: city.trim() || null,
      state: region.trim() || null,
      postalCode: postalCode.trim() || null,
      country: us ? "US" : "MX",
      sex: sex || null,
      sexDetail: sex === "other" ? sexDetail.trim() || null : null,
      emergencyName: emergencyName.trim() || null,
      emergencyPhone: withCallingCode(emergencyPhone, emergencyCountry),
      emergencyRelation: emergencyRelation.trim() || null,
      acceptedPolicies,
      referralSource: referralSource || null,
      referralSourceOther: referralSource === "other" ? referralOther.trim() || null : null,
      locale,
    };
  }

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
    if (!acceptedPolicies) {
      setError(t("policyRequired"));
      return;
    }
    if ((birthDay || birthMonth || birthYear) && !birthIso) {
      setError(t("birthDateInvalid"));
      return;
    }
    setError(null);
    setLoading(true);
    const response = await fetch("/api/auth/email-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, locale, purpose: "register" }),
    });
    const body = (await response.json().catch(() => ({}))) as { error?: string };
    setLoading(false);
    if (!response.ok) {
      setError(body.error || t("rateLimit"));
      return;
    }
    setPendingEmail(email);
    setCodeSent(true);
    if (typeof window !== "undefined") {
      try {
        sessionStorage.setItem("thrive_pending_profile", JSON.stringify(profilePayload()));
      } catch {
        /* ignore */
      }
    }
  }

  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault();
    if (!pendingEmail || !otpCode.trim()) return;
    setError(null);
    setVerifying(true);
    const response = await fetch("/api/auth/verify-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({
        email: pendingEmail,
        code: otpCode.trim(),
        purpose: "register",
        profile: profilePayload(),
      }),
    });
    const body = (await response.json().catch(() => ({}))) as { error?: string };
    setVerifying(false);
    if (!response.ok) {
      setError(body.error || t("invalidCode"));
      return;
    }
    try {
      if (typeof window !== "undefined") sessionStorage.removeItem("thrive_pending_profile");
    } catch {
      /* ignore */
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="firstName" className="block text-base font-medium text-muted mb-2">{t("firstName")}</label>
            <input id="firstName" type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} required autoComplete="given-name" className="w-full rounded-xl border border-theme bg-surface px-5 py-4 text-base md:text-lg focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary))]" placeholder={t("firstNamePlaceholder")} />
          </div>
          <div>
            <label htmlFor="middleName" className="block text-base font-medium text-muted mb-2">{t("middleName")}</label>
            <input id="middleName" type="text" value={middleName} onChange={(e) => setMiddleName(e.target.value)} autoComplete="additional-name" className="w-full rounded-xl border border-theme bg-surface px-5 py-4 text-base md:text-lg focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary))]" placeholder={t("middleNamePlaceholder")} />
          </div>
          <div className={usAddress ? "sm:col-span-2" : undefined}>
            <label htmlFor="paternalSurname" className="block text-base font-medium text-muted mb-2">{usAddress ? t("lastName") : t("paternalSurname")}</label>
            <input id="paternalSurname" type="text" value={paternalSurname} onChange={(e) => setPaternalSurname(e.target.value)} required autoComplete="family-name" className="w-full rounded-xl border border-theme bg-surface px-5 py-4 text-base md:text-lg focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary))]" placeholder={usAddress ? t("lastNamePlaceholder") : t("paternalSurnamePlaceholder")} />
          </div>
          {usAddress ? null : (
          <div>
            <label htmlFor="maternalSurname" className="block text-base font-medium text-muted mb-2">{t("maternalSurname")}</label>
            <input id="maternalSurname" type="text" value={maternalSurname} onChange={(e) => setMaternalSurname(e.target.value)} className="w-full rounded-xl border border-theme bg-surface px-5 py-4 text-base md:text-lg focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary))]" placeholder={t("maternalSurnamePlaceholder")} />
          </div>
          )}
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
        <PhoneField
          id="phone"
          label={t("phone")}
          countryLabel={t("phoneCountry")}
          locale={locale}
          country={phoneCountry}
          onCountry={setPhoneCountry}
          value={phone}
          onChange={setPhone}
          placeholder={usAddress ? t("phonePlaceholderUs") : t("phonePlaceholder")}
        />
        <div className="space-y-2">
          <p className="block text-base font-medium text-muted">{t("birthDate")}</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {(usAddress ? ["month", "day", "year"] : ["day", "month", "year"]).map((part) => {
              if (part === "day") {
                const max = daysInMonth(birthYear, birthMonth);
                return (
                  <div key="day">
                    <label htmlFor="birthDay" className="block text-sm font-medium text-muted mb-2">{t("birthDay")}</label>
                    <select id="birthDay" value={birthDay} onChange={(e) => setBirthDay(e.target.value)} className={fieldClass}>
                      <option value="">{t("birthDay")}</option>
                      {Array.from({ length: max }, (_, i) => String(i + 1)).map((day) => <option key={day} value={day}>{day}</option>)}
                    </select>
                  </div>
                );
              }
              if (part === "month") {
                const names = new Intl.DateTimeFormat(locale, { month: "long" });
                return (
                  <div key="month">
                    <label htmlFor="birthMonth" className="block text-sm font-medium text-muted mb-2">{t("birthMonth")}</label>
                    <select id="birthMonth" value={birthMonth} onChange={(e) => setBirthMonth(e.target.value)} className={fieldClass}>
                      <option value="">{t("birthMonth")}</option>
                      {Array.from({ length: 12 }, (_, i) => (
                        <option key={i + 1} value={String(i + 1)}>{names.format(new Date(2020, i, 1))}</option>
                      ))}
                    </select>
                  </div>
                );
              }
              const thisYear = new Date().getFullYear();
              return (
                <div key="year">
                  <label htmlFor="birthYear" className="block text-sm font-medium text-muted mb-2">{t("birthYear")}</label>
                  <select id="birthYear" value={birthYear} onChange={(e) => setBirthYear(e.target.value)} className={fieldClass}>
                    <option value="">{t("birthYear")}</option>
                    {Array.from({ length: 121 }, (_, i) => String(thisYear - i)).map((year) => <option key={year} value={year}>{year}</option>)}
                  </select>
                </div>
              );
            })}
          </div>
        </div>
        <div className="sm:max-w-xs">
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
            className={fieldClass}
            placeholder={t("agePlaceholder")}
          />
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
        <div className="space-y-4">
          {usAddress ? (
            <div>
              <label htmlFor="streetNumber" className="block text-base font-medium text-muted mb-2">{t("addressNumber")}</label>
              <input id="streetNumber" value={streetNumber} onChange={(e) => setStreetNumber(e.target.value)} className={fieldClass} />
            </div>
          ) : null}
          <div>
            <label htmlFor="street" className="block text-base font-medium text-muted mb-2">{t("addressStreet")}</label>
            <input id="street" value={street} onChange={(e) => setStreet(e.target.value)} autoComplete="address-line1" className={fieldClass} />
          </div>
          {usAddress ? null : (
            <div>
              <label htmlFor="streetNumber" className="block text-base font-medium text-muted mb-2">{t("addressNumber")}</label>
              <input id="streetNumber" value={streetNumber} onChange={(e) => setStreetNumber(e.target.value)} className={fieldClass} />
            </div>
          )}
          {usAddress ? null : (
            <div>
              <label htmlFor="neighborhood" className="block text-base font-medium text-muted mb-2">{t("addressNeighborhood")}</label>
              <input id="neighborhood" value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} className={fieldClass} />
            </div>
          )}
          <div>
            <label htmlFor="city" className="block text-base font-medium text-muted mb-2">{t("addressCity")}</label>
            <input id="city" value={city} onChange={(e) => setCity(e.target.value)} autoComplete="address-level2" className={fieldClass} />
          </div>
          <div>
            <label htmlFor="region" className="block text-base font-medium text-muted mb-2">{t("addressState")}</label>
            <input id="region" value={region} onChange={(e) => setRegion(e.target.value)} autoComplete="address-level1" className={fieldClass} />
          </div>
          <div>
            <label htmlFor="postalCode" className="block text-base font-medium text-muted mb-2">{usAddress ? t("addressZip") : t("addressPostal")}</label>
            <input id="postalCode" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} autoComplete="postal-code" className={fieldClass} />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="min-w-0">
            <label htmlFor="sex" className="auth-label-equal block text-base font-medium text-muted mb-2">
              {t("sex")}
            </label>
            <select
              id="sex"
              value={sex}
              onChange={(e) => setSex(e.target.value as typeof sex)}
              className="w-full min-w-0 rounded-xl border border-theme bg-surface px-3 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary))]"
            >
              <option value="">{t("sexChoose")}</option>
              <option value="female">{t("sexFemale")}</option>
              <option value="male">{t("sexMale")}</option>
              <option value="other">{t("sexAnother")}</option>
              <option value="prefer_not">{t("sexPreferNot")}</option>
            </select>
          </div>
          <div className="min-w-0">
            <label htmlFor="referralSource" className="auth-label-equal block text-base font-medium text-muted mb-2">
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
        {sex === "other" ? (
          <div>
            <label htmlFor="sexDetail" className="block text-base font-medium text-muted mb-2">{t("sexDetail")}</label>
            <input id="sexDetail" value={sexDetail} onChange={(e) => setSexDetail(e.target.value)} className="w-full rounded-xl border border-theme bg-surface px-5 py-4 text-base md:text-lg focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary))]" placeholder={t("sexDetail")} />
          </div>
        ) : null}
        <fieldset className="space-y-4">
          <legend className="text-base font-medium text-muted mb-2">{t("emergencyTitle")}</legend>
          <input aria-label={t("emergencyName")} value={emergencyName} onChange={(e) => setEmergencyName(e.target.value)} placeholder={t("emergencyName")} className="w-full rounded-xl border border-theme bg-surface px-5 py-4 text-base focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary))]" />
          <PhoneField
            id="emergencyPhone"
            label={t("emergencyPhone")}
            countryLabel={t("phoneCountry")}
            locale={locale}
            country={emergencyCountry}
            onCountry={setEmergencyCountry}
            value={emergencyPhone}
            onChange={setEmergencyPhone}
            placeholder={usAddress ? t("phonePlaceholderUs") : t("phonePlaceholder")}
          />
          <input aria-label={t("emergencyRelation")} value={emergencyRelation} onChange={(e) => setEmergencyRelation(e.target.value)} placeholder={t("emergencyRelation")} className="w-full rounded-xl border border-theme bg-surface px-5 py-4 text-base focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary))]" />
        </fieldset>
        <div>
          <p className="text-base font-medium text-muted mb-2">{t("policyTitle")}</p>
          <p className="text-sm text-muted mb-2">{t("policyHint")}</p>
          <div
            ref={policyRef}
            onScroll={(e) => markPolicyRead(e.currentTarget)}
            className="max-h-40 overflow-y-auto rounded-xl border border-theme bg-surface px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap"
          >
            {t("policyBody")}
          </div>
          <label className="mt-3 flex items-start gap-3 text-sm">
            <input
              type="checkbox"
              className="mt-1"
              checked={acceptedPolicies}
              disabled={!policyRead}
              onChange={(e) => setAcceptedPolicies(e.target.checked)}
            />
            <span>{t("policyAccept")}</span>
          </label>
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
          disabled={loading || !acceptedPolicies}
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
