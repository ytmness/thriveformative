"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase";
import BrandCtaButton from "@/components/ui/BrandCtaButton";
import "@/app/styles/contact-section.css";

type Props = {
  /** Sin borde exterior; el contenedor padre define la tarjeta */
  embedded?: boolean;
};

export default function ContactForm({ embedded = false }: Props) {
  const t = useTranslations("contactForm");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const honeypot = String(formData.get("website") ?? "");
    const supabase = createClient();
    const { error: err } = await supabase.from("contact_requests").insert({
      name: name.trim(),
      email: email.trim(),
      subject: subject.trim() || null,
      message: message.trim(),
    });
    if (err) {
      setLoading(false);
      setError(err.message);
      return;
    }
    try {
      const res1 = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "contact_confirmation",
          email: email.trim(),
          name: name.trim(),
          website: honeypot,
        }),
      });
      if (res1.ok) {
        await fetch("/api/send-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            kind: "contact_notify_admin",
            name: name.trim(),
            email: email.trim(),
            subject: subject.trim() || null,
            message: message.trim(),
            website: honeypot,
          }),
        });
      }
    } catch {
      // El mensaje ya se guardó; el correo es opcional
    }
    setLoading(false);
    setSent(true);
    setName("");
    setEmail("");
    setSubject("");
    setMessage("");
  }

  if (sent) {
    const success = (
      <div className={embedded ? "contact-form__success" : "rounded-2xl border border-theme bg-surface p-8 text-center"}>
        <p className={embedded ? "contact-form__success-title" : "text-lg font-medium text-[rgb(var(--primary))]"}>
          {t("success")}
        </p>
        <p className={embedded ? "contact-form__success-desc" : "text-muted mt-2"}>{t("successDesc")}</p>
      </div>
    );
    return success;
  }

  const formContent = (
    <>
      <h3 className={embedded ? "contact-form__title" : "text-lg font-semibold"}>{t("title")}</h3>
      {error ? <div className="contact-form__error">{error}</div> : null}
      <div className={embedded ? "contact-form__fields" : "space-y-4"}>
        <div className={embedded ? "contact-form__field" : undefined}>
          <label htmlFor="contact-name" className={embedded ? undefined : "block text-sm font-medium text-muted mb-1"}>
            {t("name")}
          </label>
          <input
            id="contact-name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={
              embedded
                ? undefined
                : "w-full rounded-xl border border-theme bg-[rgb(var(--bg)/0.5)] px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary))]"
            }
            placeholder={t("namePlaceholder")}
          />
        </div>
        <div className={embedded ? "contact-form__field" : undefined}>
          <label htmlFor="contact-email" className={embedded ? undefined : "block text-sm font-medium text-muted mb-1"}>
            {t("email")}
          </label>
          <input
            id="contact-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={
              embedded
                ? undefined
                : "w-full rounded-xl border border-theme bg-[rgb(var(--bg)/0.5)] px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary))]"
            }
            placeholder={t("emailPlaceholder")}
          />
        </div>
        <div className={embedded ? "contact-form__field" : undefined}>
          <label htmlFor="contact-subject" className={embedded ? undefined : "block text-sm font-medium text-muted mb-1"}>
            {t("subject")}
          </label>
          <input
            id="contact-subject"
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className={
              embedded
                ? undefined
                : "w-full rounded-xl border border-theme bg-[rgb(var(--bg)/0.5)] px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary))]"
            }
            placeholder={t("subjectPlaceholder")}
          />
        </div>
        <div className={embedded ? "contact-form__field" : undefined}>
          <label htmlFor="contact-message" className={embedded ? undefined : "block text-sm font-medium text-muted mb-1"}>
            {t("message")}
          </label>
          <textarea
            id="contact-message"
            required
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className={
              embedded
                ? undefined
                : "w-full rounded-xl border border-theme bg-[rgb(var(--bg)/0.5)] px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary))] resize-y"
            }
            placeholder={t("messagePlaceholder")}
          />
        </div>
      </div>
      <input
        type="text"
        name="website"
        autoComplete="off"
        aria-hidden
        className="sr-only"
        style={{ position: "absolute", left: "-9999px" }}
        defaultValue=""
      />
      <BrandCtaButton type="submit" disabled={loading} block>
        {loading ? t("sending") : t("submit")}
      </BrandCtaButton>
    </>
  );

  if (embedded) {
    return (
      <form onSubmit={handleSubmit} className="contact-form">
        {formContent}
      </form>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-theme bg-surface p-8 space-y-4"
    >
      {formContent}
    </form>
  );
}
