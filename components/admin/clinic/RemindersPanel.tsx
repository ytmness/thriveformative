"use client";

import { useEffect, useState } from "react";
import { api } from "@/components/admin/clinic/client";
import { useAdminEnglish } from "@/components/admin/clinic/ClinicScope";

type Rule = {
  id: string;
  offsetMinutes: number;
  channel: string;
  isActive: boolean;
  label: string;
};

type Template = {
  id: string;
  channel: string;
  locale: string;
  subject: string | null;
  body: string;
  isActive: boolean;
};

type Messaging = {
  quietStart: number;
  quietEnd: number;
  smsProvider: string;
};

export function RemindersPanel() {
  const english = useAdminEnglish();
  const [rules, setRules] = useState<Rule[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [messaging, setMessaging] = useState<Messaging>({ quietStart: 21, quietEnd: 8, smsProvider: "telnyx" });
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  async function load() {
    const data = await api<{ messaging: Messaging; rules: Rule[]; templates: Template[] }>("/api/admin/settings/reminders");
    setMessaging(data.messaging);
    setRules(data.rules || []);
    setTemplates(data.templates || []);
  }

  useEffect(() => {
    load().catch((err) => setError(err instanceof Error ? err.message : "No se pudo cargar."));
  }, []);

  return (
    <div>
      <header className="admin-header">
        <div>
          <p className="admin-header__eyebrow">{english ? "Messaging" : "Mensajería"}</p>
          <h1 className="admin-header__title">{english ? "Reminders" : "Recordatorios"}</h1>
          <p className="admin-header__desc">
            {english
              ? "SMS via Telnyx (default) or Plivo. WhatsApp via Meta Cloud API. Twilio stays available but disabled."
              : "SMS con Telnyx (por defecto) o Plivo. WhatsApp con Meta Cloud API. Twilio queda disponible pero desactivado."}
          </p>
        </div>
      </header>
      {error ? <div className="admin-alert" role="alert">{error}</div> : null}
      {saved ? <p className="admin-notice" role="status">{english ? "Changes saved." : "Cambios guardados."}</p> : null}

      <section className="admin-card" style={{ marginBottom: "1rem" }}>
        <h2>{english ? "Quiet hours" : "Horario silencioso"}</h2>
        <div className="admin-toolbar" style={{ flexWrap: "wrap", gap: "0.75rem" }}>
          <label>
            {english ? "From" : "Desde"}{" "}
            <input
              type="number"
              min={0}
              max={23}
              value={messaging.quietStart}
              onChange={(e) => setMessaging({ ...messaging, quietStart: Number(e.target.value) })}
            />
          </label>
          <label>
            {english ? "Until" : "Hasta"}{" "}
            <input
              type="number"
              min={0}
              max={23}
              value={messaging.quietEnd}
              onChange={(e) => setMessaging({ ...messaging, quietEnd: Number(e.target.value) })}
            />
          </label>
          <label>
            SMS{" "}
            <select
              value={messaging.smsProvider}
              onChange={(e) => setMessaging({ ...messaging, smsProvider: e.target.value })}
            >
              <option value="telnyx">Telnyx</option>
              <option value="plivo">Plivo</option>
              <option value="twilio">Twilio ({english ? "disabled unless selected" : "solo si se elige"})</option>
            </select>
          </label>
        </div>
      </section>

      <section className="admin-card" style={{ marginBottom: "1rem" }}>
        <h2>{english ? "Reminder windows" : "Ventanas de recordatorio"}</h2>
        {rules.map((rule, index) => (
          <div key={`${rule.offsetMinutes}-${index}`} className="admin-toolbar" style={{ marginBottom: "0.5rem" }}>
            <label className="admin-check">
              <input
                type="checkbox"
                checked={rule.isActive}
                onChange={(e) => {
                  const next = [...rules];
                  next[index] = { ...rule, isActive: e.target.checked };
                  setRules(next);
                }}
              />
              {rule.label}
            </label>
            <select
              value={rule.channel}
              onChange={(e) => {
                const next = [...rules];
                next[index] = { ...rule, channel: e.target.value };
                setRules(next);
              }}
            >
              <option value="sms">SMS</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="email">Email</option>
            </select>
          </div>
        ))}
      </section>

      <section className="admin-card" style={{ marginBottom: "1rem" }}>
        <h2>{english ? "Templates ES/EN" : "Plantillas ES/EN"}</h2>
        {templates.map((template, index) => (
          <div key={template.id} style={{ marginBottom: "1rem" }}>
            <div className="admin-table__cell-title">
              {template.channel} · {template.locale.toUpperCase()}
            </div>
            {template.channel === "email" ? (
              <input
                style={{ width: "100%", marginBottom: "0.35rem" }}
                value={template.subject || ""}
                onChange={(e) => {
                  const next = [...templates];
                  next[index] = { ...template, subject: e.target.value };
                  setTemplates(next);
                }}
                placeholder={english ? "Subject" : "Asunto"}
              />
            ) : null}
            <textarea
              rows={3}
              style={{ width: "100%" }}
              value={template.body}
              onChange={(e) => {
                const next = [...templates];
                next[index] = { ...template, body: e.target.value };
                setTemplates(next);
              }}
            />
          </div>
        ))}
      </section>

      <button
        className="admin-btn admin-btn--primary"
        type="button"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setSaved(false);
          setError(null);
          try {
            const data = await api<{ messaging: Messaging; rules: Rule[]; templates: Template[] }>(
              "/api/admin/settings/reminders",
              {
                method: "PUT",
                body: JSON.stringify({
                  messaging,
                  rules: rules.map((rule) => ({
                    offsetMinutes: rule.offsetMinutes,
                    channel: rule.channel,
                    isActive: rule.isActive,
                  })),
                  templates: templates.map((template) => ({
                    id: template.id,
                    subject: template.subject,
                    body: template.body,
                    isActive: template.isActive,
                  })),
                }),
              }
            );
            setMessaging(data.messaging);
            setRules(data.rules || []);
            setTemplates(data.templates || []);
            setSaved(true);
          } catch (err) {
            setError(err instanceof Error ? err.message : "No se pudo guardar.");
          } finally {
            setBusy(false);
          }
        }}
      >
        {english ? "Save reminders" : "Guardar recordatorios"}
      </button>
    </div>
  );
}
