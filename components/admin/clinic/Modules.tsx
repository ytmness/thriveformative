"use client";

import { useEffect, useRef, useState } from "react";
import { api } from "@/components/admin/clinic/client";
import { CloseButton, EmptyState } from "@/components/admin/ui";
import { CreateOffer } from "@/components/admin/tutorial";

function statusLabel(value: string) {
  const labels: Record<string, string> = { draft: "Borrador", issued: "Emitida", paid: "Pagada", partial: "Parcial", void: "Anulada", open: "Abierta", sent: "Enviada" };
  return labels[value] || value || "—";
}

export function InvoiceCenter() {
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [kind, setKind] = useState("invoices");
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    api<{ rows: Record<string, unknown>[] }>(`/api/admin/invoices?kind=${kind === "invoices" ? "" : kind}`).then((r) => setRows(r.rows)).catch((e) => setError(e.message));
  }, [kind]);
  return (
    <>
      <header className="admin-header"><p className="admin-header__eyebrow">Cobros</p><h1 className="admin-header__title">Facturas y pagos</h1></header>
      {error ? <div className="admin-alert">{error}</div> : null}
      <div className="admin-tabs" data-tour="invoice-tabs">
        {[["invoices", "Facturas"], ["quotes", "Cotizaciones"], ["credits", "Notas de crédito"]].map(([id, label]) => <button key={id} className={kind === id ? "is-active" : ""} type="button" onClick={() => setKind(id)}>{label}</button>)}
      </div>
      {kind !== "invoices" ? (
        <form className="admin-toolbar" data-tour="invoice-form" onSubmit={async (e) => {
          e.preventDefault();
          const data = new FormData(e.currentTarget);
          if (kind === "quotes") {
            await api("/api/admin/invoices", { method: "POST", body: JSON.stringify({ kind: "quote", items: [{ description: String(data.get("desc")), quantity: 1, unitPrice: Number(data.get("amount")) }] }) });
          } else {
            await api("/api/admin/invoices", { method: "POST", body: JSON.stringify({ kind: "credit", invoiceId: String(data.get("invoice")), amount: Number(data.get("amount")), reason: String(data.get("desc")) }) });
          }
          location.reload();
        }}>
          <input name="desc" placeholder={kind === "quotes" ? "Descripción" : "Motivo"} required />
          <input name="amount" type="number" step="0.01" placeholder="Monto" required />
          {kind === "credits" ? <input name="invoice" placeholder="ID de factura" required /> : null}
          <button className="admin-btn admin-btn--primary" type="submit">{kind === "quotes" ? "Nueva cotización" : "Nota de crédito"}</button>
        </form>
      ) : null}
      <div className="admin-table-wrap" data-tour="invoice-table">
        <div className="admin-table__row admin-table__head"><span>Número</span><span>Paciente</span><span>Estado</span><span>Total</span></div>
        {rows.map((row) => (
          <div key={String(row.id)} className="admin-table__row">
            <div className="admin-table__cell-title">{String(row.invoice_number || row.quote_number || row.credit_number || "—")}</div>
            <div>{[row.first_name, row.last_name].filter(Boolean).join(" ") || "—"}</div>
            <div>{statusLabel(String(row.status || ""))}</div>
            <div>${Number(row.total || row.amount || 0).toFixed(2)}</div>
          </div>
        ))}
        {!rows.length ? <EmptyState title={kind === "quotes" ? "Sin cotizaciones" : kind === "credits" ? "Sin notas de crédito" : "Sin facturas"} text="Se crean al cobrar." action={<CreateOffer show={kind === "invoices"} kind="sale" href="/admin/cobrar" />} /> : null}
      </div>
    </>
  );
}

export function FormBuilder() {
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [name, setName] = useState("");
  const [formType, setFormType] = useState("consent");
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState<{ id: string; label: string; type: string; required: boolean }[]>([]);
  useEffect(() => { api<{ rows: Record<string, unknown>[] }>("/api/admin/forms").then((r) => setRows(r.rows)); }, []);
  function reset() {
    setTemplateId(null);
    setName("");
    setFormType("consent");
    setFields([]);
  }
  return (
    <>
      <header className="admin-header"><p className="admin-header__eyebrow">Clínico</p><h1 className="admin-header__title">Formularios</h1><p className="admin-header__desc">Elige una plantilla de la lista para volver a abrirla.</p></header>
      {error ? <div className="admin-alert" role="alert">{error}</div> : null}
      {notice ? <p className="admin-notice" role="status">{notice}</p> : null}
      <form className="admin-form-grid" data-tour="form-builder" onSubmit={async (e) => {
        e.preventDefault();
        setError(null);
        try {
          await api("/api/admin/forms", { method: "POST", body: JSON.stringify({ id: templateId, name, formType, requiresSignature: formType === "consent" || fields.some((field) => field.type === "signature"), schema: fields }) });
          setNotice(templateId ? "Plantilla actualizada." : "Plantilla guardada.");
          reset();
          const next = await api<{ rows: Record<string, unknown>[] }>("/api/admin/forms");
          setRows(next.rows);
        } catch (err) {
          setError(err instanceof Error ? err.message : "No se pudo guardar la plantilla.");
        }
      }}>
        <label className="admin-field">Nombre<input required value={name} onChange={(e) => setName(e.target.value)} /></label>
        <label className="admin-field">Tipo<select value={formType} onChange={(e) => setFormType(e.target.value)}><option value="intake">Ingreso</option><option value="consent">Consentimiento</option><option value="soap">SOAP</option><option value="custom">Personalizado</option></select></label>
        <button className="admin-btn" type="button" onClick={() => setFields([...fields, { id: crypto.randomUUID(), label: "Campo", type: "text", required: false }])}>Agregar campo</button>
        {fields.map((field, index) => (
          <div key={field.id} className="admin-toolbar span-2">
            <label className="admin-field">Etiqueta<input value={field.label} onChange={(e) => setFields(fields.map((item, i) => i === index ? { ...item, label: e.target.value } : item))} /></label>
            <label className="admin-field">Tipo
              <select value={field.type} onChange={(e) => setFields(fields.map((item, i) => i === index ? { ...item, type: e.target.value } : item))}>
                <option value="text">Texto</option>
                <option value="textarea">Párrafo</option>
                <option value="date">Fecha</option>
                <option value="checkbox">Casilla</option>
                <option value="select">Lista</option>
                <option value="signature">Firma</option>
              </select>
            </label>
            <label className="admin-check"><input type="checkbox" checked={field.required} onChange={(e) => setFields(fields.map((item, i) => i === index ? { ...item, required: e.target.checked } : item))} />Obligatorio</label>
          </div>
        ))}
        <div className="admin-toolbar span-2">
          <button className="admin-btn admin-btn--primary" type="submit" data-tour="form-save">{templateId ? "Guardar cambios" : "Guardar plantilla"}</button>
          {templateId ? <button className="admin-btn" type="button" onClick={reset}>Nueva plantilla</button> : null}
        </div>
      </form>
      <div className="admin-table-wrap" data-tour="form-list" style={{ marginTop: "1rem" }}>
        <div className="admin-table__row admin-table__head"><span>Plantilla</span><span>Tipo</span><span>Versión</span></div>
        {rows.map((row) => (
          <div key={String(row.id)} className="admin-table__row" role="button" tabIndex={0} onClick={() => {
            setTemplateId(String(row.id));
            setName(String(row.name || ""));
            setFormType(String(row.form_type || "custom"));
            setFields(Array.isArray(row.schema) ? row.schema as { id: string; label: string; type: string; required: boolean }[] : []);
            setNotice(`Editando «${String(row.name || "plantilla")}».`);
            setError(null);
          }} onKeyDown={(event) => { if (event.key === "Enter") (event.currentTarget as HTMLDivElement).click(); }}>
            <div>{String(row.name)}</div><div>{String(row.form_type)}{row.requires_signature ? " · con firma" : ""}</div><div>v{String(row.version)}</div>
            <button className="admin-btn" type="button" onClick={async (event) => {
              event.stopPropagation();
              if (!window.confirm(`¿Archivar «${String(row.name)}»? Dejará de aparecer en la lista. La plantilla se conserva.`)) return;
              try {
                await api("/api/admin/forms", { method: "POST", body: JSON.stringify({ action: "archive", id: row.id }) });
                setNotice("Plantilla archivada.");
                setRows(rows.filter((item) => item.id !== row.id));
                if (templateId === row.id) reset();
              } catch (err) {
                setError(err instanceof Error ? err.message : "No se pudo archivar la plantilla.");
              }
            }}>Archivar</button>
          </div>
        ))}
        {!rows.length ? <div className="admin-table__empty">No hay plantillas. Crea un consentimiento o un ingreso.</div> : null}
      </div>
    </>
  );
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

