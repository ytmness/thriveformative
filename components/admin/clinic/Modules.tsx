"use client";

import { useEffect, useRef, useState } from "react";
import { api } from "@/components/admin/clinic/client";
import { CloseButton, EmptyState } from "@/components/admin/ui";

function statusLabel(value: string) {
  const labels: Record<string, string> = { draft: "Borrador", issued: "Emitida", paid: "Pagada", partial: "Parcial", void: "Anulada", open: "Abierta", sent: "Enviada" };
  return labels[value] || value || "—";
}

export function CommsAdmin() {
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [templates, setTemplates] = useState<Record<string, unknown>[]>([]);
  const [draft, setDraft] = useState<Record<string, unknown> | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const names: Record<string, string> = { recordatorio: "Recordatorio de cita", cita_creada: "Cita creada", cancelacion: "Cancelación" };
  const variables = ["nombre", "servicio", "fecha", "hora", "sede"];
  const statusLabel: Record<string, [string, string]> = {
    queued: ["En cola", "admin-badge admin-badge--wait"],
    sent: ["Enviado", "admin-badge admin-badge--ok"],
    skipped: ["Omitido", "admin-badge admin-badge--muted"],
    failed: ["Error", "admin-badge admin-badge--bad"],
  };
  function preview(text: string) {
    return text
      .replaceAll("{{nombre}}", "Ana Ruiz")
      .replaceAll("{{servicio}}", "Consulta inicial")
      .replaceAll("{{fecha}}", "lunes 6 de octubre")
      .replaceAll("{{hora}}", "10:00")
      .replaceAll("{{sede}}", "Thrive Formative");
  }
  async function load() {
    const [messages, saved] = await Promise.all([
      api<{ rows: Record<string, unknown>[] }>("/api/admin/messages"),
      api<{ rows: Record<string, unknown>[] }>("/api/admin/settings/message-templates"),
    ]);
    setRows(messages.rows);
    setTemplates(saved.rows);
  }
  useEffect(() => { load().catch(() => undefined); }, []);
  const pending = rows.filter((row) => row.status === "queued").length;
  function insertVariable(name: string) {
    if (!draft) return;
    const token = `{{${name}}}`;
    const area = bodyRef.current;
    const current = String(draft.body || "");
    const start = area?.selectionStart ?? current.length;
    const next = `${current.slice(0, start)}${token}${current.slice(area?.selectionEnd ?? start)}`;
    setDraft({ ...draft, body: next });
  }
  return (
    <>
      <header className="admin-header"><p className="admin-header__eyebrow">Mensajes</p><h1 className="admin-header__title">Comunicaciones</h1></header>
      <div className="admin-chips" aria-label="Variables">
        {variables.map((name) => <span key={name} className="admin-badge admin-badge--muted">{`{{${name}}}`}</span>)}
      </div>
      <div className="admin-page-head">
        <h2 style={{ margin: 0, fontSize: "1.05rem" }}>Plantillas</h2>
        <button className="admin-btn admin-btn--primary" type="button" data-tour="comms-send" disabled={!pending} onClick={async () => {
          if (!window.confirm(`¿Enviar ${pending} pendiente${pending === 1 ? "" : "s"}?`)) return;
          await api("/api/admin/messages", { method: "POST", body: JSON.stringify({ action: "dispatch" }) });
          setNotice(pending === 1 ? "Se envió 1 mensaje." : `Se enviaron ${pending} mensajes.`);
          await load();
        }}>{pending ? `Enviar ${pending} pendiente${pending === 1 ? "" : "s"}` : "Enviar cola pendiente"}</button>
      </div>
      {notice ? <p className="admin-notice" role="status">{notice}</p> : null}
      <div style={{ display: "grid", gap: "0.75rem" }} data-tour="comms-templates">
        {templates.map((row) => {
          const channel = String(row.channel) === "sms" ? "SMS" : "Email";
          return (
            <article key={String(row.id)} className="admin-template">
              <div className="admin-template__top">
                <h3>{names[String(row.template_key)] || String(row.template_key)}</h3>
                <span className={channel === "SMS" ? "admin-badge admin-badge--sms" : "admin-badge admin-badge--email"}>{channel}</span>
              </div>
              <p style={{ margin: 0, color: "rgb(var(--muted))" }}>{preview(String(row.body || row.subject || "Sin texto"))}</p>
              <div><button className="admin-btn" type="button" onClick={() => setDraft(row)}>Editar</button></div>
            </article>
          );
        })}
        {!templates.length ? <EmptyState title="Sin plantillas" text="Las plantillas de cita aparecen aquí cuando existen en la clínica." /> : null}
      </div>
      {draft ? (
        <div className="admin-drawer" onClick={() => setDraft(null)}>
          <form className="admin-drawer__panel" data-tour="comms-editor" onClick={(e) => e.stopPropagation()} onSubmit={async (e) => {
            e.preventDefault();
            await api(`/api/admin/settings/message-templates/${draft.id}`, { method: "PATCH", body: JSON.stringify({ channel: draft.channel, templateKey: draft.template_key, locale: draft.locale || "es", subject: draft.subject, body: draft.body, isActive: draft.is_active !== false }) });
            setDraft(null);
            setNotice("Plantilla guardada.");
            await load();
          }}>
            <div className="admin-drawer__head">
              <h2 className="admin-header__title" style={{ margin: 0, fontSize: "1.25rem" }}>Editar: {names[String(draft.template_key)] || String(draft.template_key)}</h2>
              <CloseButton onClick={() => setDraft(null)} />
            </div>
            <div className="admin-drawer__body">
              <div className="admin-chips">
                {variables.map((name) => <button key={name} type="button" onClick={() => insertVariable(name)}>{`{{${name}}}`}</button>)}
              </div>
              <label className="admin-field"><span className="admin-field__label">Asunto</span><input value={String(draft.subject || "")} onChange={(e) => setDraft({ ...draft, subject: e.target.value })} /></label>
              <label className="admin-field" style={{ marginTop: 16 }}><span className="admin-field__label">Mensaje</span><textarea ref={bodyRef} required rows={5} value={String(draft.body || "")} onChange={(e) => setDraft({ ...draft, body: e.target.value })} /></label>
              {String(draft.channel) === "sms" ? <p className="admin-field__hint">{String(draft.body || "").length} caracteres{String(draft.body || "").length > 160 ? " · más de 1 SMS" : ""}</p> : null}
              <p style={{ marginTop: 12 }}><strong>Vista previa.</strong> {preview(String(draft.body || ""))}</p>
            </div>
            <div className="admin-drawer__foot">
              <button className="admin-btn" type="button" onClick={() => setDraft(null)}>Cancelar</button>
              <button className="admin-btn admin-btn--primary" type="submit">Guardar</button>
            </div>
          </form>
        </div>
      ) : null}
      <h2 style={{ margin: "1.5rem 0 0.75rem", textAlign: "left" }}>Cola</h2>
      <div className="admin-table-wrap" data-tour="comms-queue">
        <div className="admin-table__row admin-table__head" style={{ gridTemplateColumns: "6rem minmax(0,1fr) 7rem minmax(0,1.4fr) 9rem" }}><span>Canal</span><span>Destinatario</span><span>Estado</span><span>Mensaje</span><span>Fecha</span></div>
        {rows.map((row) => {
          const badge = statusLabel[String(row.status)] || [String(row.status), "admin-badge admin-badge--muted"];
          const when = row.sent_at || row.scheduled_for;
          return (
            <div key={String(row.id)} className="admin-table__row" style={{ gridTemplateColumns: "6rem minmax(0,1fr) 7rem minmax(0,1.4fr) 9rem" }}>
              <div><span className={String(row.channel) === "sms" ? "admin-badge admin-badge--sms" : "admin-badge admin-badge--email"}>{String(row.channel) === "sms" ? "SMS" : "Email"}</span></div>
              <div>{String(row.recipient || "—")}</div>
              <div><span className={badge[1]}>{badge[0]}</span></div>
              <div>{preview(String(row.body || row.subject || "—"))}</div>
              <div>{when ? new Date(String(when)).toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short" }) : "—"}</div>
            </div>
          );
        })}
        {!rows.length ? <EmptyState title="La cola está vacía" text="Los recordatorios se crean al agendar una cita." /> : null}
      </div>
    </>
  );
}

export function ReportView({ slug }: { slug?: string }) {
  const [data, setData] = useState<{ rows: Record<string, unknown>[] } | null>(null);
  const active = slug || "citas";
  useEffect(() => { api<{ rows: Record<string, unknown>[] }>(`/api/admin/reports/${active}`).then(setData); }, [active]);
  const links = [["citas", "Citas"], ["ingresos", "Ingresos"], ["servicios", "Servicios"], ["profesionales", "Profesionales"], ["marketing", "Marketing"], ["no-shows", "No-shows"]];
  const labels: Record<string, string> = {
    status: "Estado", total: "Total", day: "Día", description: "Concepto", quantity: "Cantidad",
    first_name: "Nombre", last_name: "Apellido", completed: "Completadas", no_shows: "Inasistencias",
    revenue: "Ingresos", source: "Fuente", week: "Semana",
  };
  const rows = data?.rows || [];
  const keys = rows[0] ? Object.keys(rows[0]) : [];
  return (
    <>
      <header className="admin-header"><h1 className="admin-header__title">Reportes</h1><p className="admin-header__desc">Últimos 30 días.</p></header>
      <nav className="admin-tabs admin-tabs--wrap" data-tour="report-tabs">{links.map(([id, label]) => <a key={id} className={active === id ? "is-active" : ""} href={`/admin/reportes/${id}`}>{label}</a>)}</nav>
      <div className="admin-table-wrap" data-tour="report-table">
        <div className="admin-table__row admin-table__head">{keys.length ? keys.map((key) => <span key={key}>{labels[key] || key}</span>) : <span>Resultado</span>}</div>
        {rows.map((row, index) => (
          <div key={index} className="admin-table__row">
            {Object.entries(row).map(([key, value]) => <span key={key}>{formatReport(key, value)}</span>)}
          </div>
        ))}
        {!rows.length ? <div className="admin-table__empty">No hay datos en este periodo. Aparecerán cuando haya citas, cobros o pacientes nuevos.</div> : null}
      </div>
    </>
  );
}

function formatReport(key: string, value: unknown) {
  if (value == null || value === "") return "—";
  if (key === "status") return statusLabel(String(value));
  if (key === "revenue") return `$${Number(value).toFixed(2)}`;
  if (typeof value === "string" && value.includes("T")) {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) return date.toLocaleDateString("es-MX");
  }
  return String(value);
}

