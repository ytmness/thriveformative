"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase";

export default function ContactForm() {
  const t = useTranslations("contactForm");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error: err } = await supabase.from("contact_requests").insert({
      name: name.trim(),
      email: email.trim(),
      subject: subject.trim() || null,
      message: message.trim(),
    });
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    setSent(true);
    setName("");
    setEmail("");
    setSubject("");
    setMessage("");
  }

  if (sent) {
    return (
      <div className="rounded-2xl border border-theme bg-surface p-8 text-center">
        <p className="text-lg font-medium text-[rgb(var(--primary))]">{t("success")}</p>
        <p className="text-muted mt-2">{t("successDesc")}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-theme bg-surface p-8 space-y-4">
      <h3 className="text-lg font-semibold">{t("title")}</h3>
      {error && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 text-sm">
          {error}
        </div>
      )}
      <div>
        <label htmlFor="contact-name" className="block text-sm font-medium text-muted mb-1">
          {t("name")}
        </label>
        <input
          id="contact-name"
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-xl border border-theme bg-[rgb(var(--bg)/0.5)] px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary))]"
          placeholder={t("namePlaceholder")}
        />
      </div>
      <div>
        <label htmlFor="contact-email" className="block text-sm font-medium text-muted mb-1">
          {t("email")}
        </label>
        <input
          id="contact-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-xl border border-theme bg-[rgb(var(--bg)/0.5)] px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary))]"
          placeholder={t("emailPlaceholder")}
        />
      </div>
      <div>
        <label htmlFor="contact-subject" className="block text-sm font-medium text-muted mb-1">
          {t("subject")}
        </label>
        <input
          id="contact-subject"
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="w-full rounded-xl border border-theme bg-[rgb(var(--bg)/0.5)] px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary))]"
          placeholder={t("subjectPlaceholder")}
        />
      </div>
      <div>
        <label htmlFor="contact-message" className="block text-sm font-medium text-muted mb-1">
          {t("message")}
        </label>
        <textarea
          id="contact-message"
          required
          rows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full rounded-xl border border-theme bg-[rgb(var(--bg)/0.5)] px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary))] resize-y"
          placeholder={t("messagePlaceholder")}
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="btn-primary rounded-xl px-5 py-3 text-base font-medium disabled:opacity-60"
      >
        {loading ? t("sending") : t("submit")}
      </button>
    </form>
  );
}
