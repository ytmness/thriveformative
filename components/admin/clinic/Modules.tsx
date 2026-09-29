"use client";

import { useEffect, useState } from "react";
import { api } from "@/components/admin/clinic/client";

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
      <div className="admin-tabs">
        {[["invoices", "Facturas"], ["quotes", "Cotizaciones"], ["credits", "Notas de crédito"]].map(([id, label]) => <button key={id} className={kind === id ? "is-active" : ""} type="button" onClick={() => setKind(id)}>{label}</button>)}
      </div>
      <form className="admin-toolbar" onSubmit={async (e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        if (kind === "quotes") {
          await api("/api/admin/invoices", { method: "POST", body: JSON.stringify({ kind: "quote", items: [{ description: String(data.get("desc")), quantity: 1, unitPrice: Number(data.get("amount")) }] }) });
        } else {
          await api("/api/admin/invoices", { method: "POST", body: JSON.stringify({ kind: "credit", invoiceId: String(data.get("invoice")), amount: Number(data.get("amount")), reason: String(data.get("desc")) }) });
        }
        location.reload();
      }}>
        <input name="desc" placeholder="Descripción o motivo" required />
        <input name="amount" type="number" step="0.01" placeholder="Monto" required />
        {kind !== "quotes" ? <input name="invoice" placeholder="ID de factura" required /> : null}
        <button className="admin-btn admin-btn--primary" type="submit">{kind === "quotes" ? "Nueva cotización" : "Nota de crédito"}</button>
      </form>
      <div className="admin-table-wrap">
        {rows.map((row) => (
          <div key={String(row.id)} className="admin-table__row">
            <div>
              <div className="admin-table__cell-title">{String(row.invoice_number || row.quote_number || row.credit_number)}</div>
              <div className="admin-table__cell-sub">{String(row.status || "")} · ${Number(row.total || row.amount || 0).toFixed(2)} · pagado ${Number(row.paid_total || 0).toFixed(2)}</div>
            </div>
            {row.sale_id ? <button className="admin-btn admin-btn--danger" type="button" onClick={async () => {
              const paymentId = prompt("ID del pago a anular");
              if (!paymentId) return;
              await api(`/api/admin/payments/${paymentId}/void`, { method: "POST", body: JSON.stringify({ reason: "Anulación en facturación" }) });
              location.reload();
            }}>Anular pago</button> : null}
          </div>
        ))}
      </div>
    </>
  );
}

export function ProductAdmin() {
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [form, setForm] = useState({ name: "", sku: "", barcode: "", sizeLabel: "", price: "", cost: "", description: "" });
  useEffect(() => { api<{ rows: Record<string, unknown>[] }>("/api/admin/products").then((r) => setRows(r.rows)); }, []);
  return (
    <>
      <header className="admin-header"><p className="admin-header__eyebrow">Inventario</p><h1 className="admin-header__title">Productos</h1></header>
      <div className="admin-toolbar">
        <a className="admin-btn" href="/api/admin/products?export=1&format=csv">CSV</a>
        <a className="admin-btn" href="/api/admin/products?export=1&format=xlsx">Excel</a>
      </div>
      <form className="admin-form-grid" onSubmit={async (e) => { e.preventDefault(); await api("/api/admin/products", { method: "POST", body: JSON.stringify({ ...form, price: Number(form.price || 0), cost: Number(form.cost || 0) }) }); location.reload(); }}>
        <label className="admin-field">Nombre<input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
        <label className="admin-field">SKU<input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} /></label>
        <label className="admin-field">Código de barras<input value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} /></label>
        <label className="admin-field">Tamaño<input value={form.sizeLabel} onChange={(e) => setForm({ ...form, sizeLabel: e.target.value })} /></label>
        <label className="admin-field">Costo<input value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} /></label>
        <label className="admin-field">Precio<input value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></label>
        <label className="admin-field span-2">Descripción<textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label>
        <button className="admin-btn admin-btn--primary" type="submit">Guardar producto</button>
      </form>
      <div className="admin-table-wrap" style={{ marginTop: "1rem" }}>
        {rows.map((row) => (
          <div key={String(row.id)} className="admin-table__row">
            <div className="admin-table__cell-title">{String(row.name)} {row.lowStock ? "· stock bajo" : ""}</div>
            <div className="admin-table__cell-sub">SKU {String(row.sku || "—")} · ${Number(row.price || 0)}</div>
            <button className="admin-btn" type="button" onClick={async () => {
              const locationId = prompt("ID de sede");
              const quantity = prompt("Cantidad (+ compra / - merma)");
              if (!locationId || !quantity) return;
              await api("/api/admin/products", { method: "POST", body: JSON.stringify({ kind: "stock", productId: row.id, locationId, quantity: Number(quantity), movementType: "adjust", reason: "Ajuste manual" }) });
              location.reload();
            }}>Ajustar stock</button>
          </div>
        ))}
      </div>
    </>
  );
}

export function FormBuilder() {
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [name, setName] = useState("");
  const [formType, setFormType] = useState("consent");
  const [fields, setFields] = useState<{ id: string; label: string; type: string; required: boolean }[]>([]);
  useEffect(() => { api<{ rows: Record<string, unknown>[] }>("/api/admin/forms").then((r) => setRows(r.rows)); }, []);
  return (
    <>
      <header className="admin-header"><p className="admin-header__eyebrow">Clínico</p><h1 className="admin-header__title">Formularios</h1></header>
      <form className="admin-form-grid" onSubmit={async (e) => { e.preventDefault(); await api("/api/admin/forms", { method: "POST", body: JSON.stringify({ name, formType, requiresSignature: formType === "consent", schema: fields }) }); location.reload(); }}>
        <label className="admin-field">Nombre<input required value={name} onChange={(e) => setName(e.target.value)} /></label>
        <label className="admin-field">Tipo<select value={formType} onChange={(e) => setFormType(e.target.value)}><option value="intake">Ingreso</option><option value="consent">Consentimiento</option><option value="soap">SOAP</option><option value="custom">Personalizado</option></select></label>
        <button className="admin-btn" type="button" onClick={() => setFields([...fields, { id: crypto.randomUUID(), label: "Campo", type: "text", required: false }])}>Agregar campo</button>
        {fields.map((field, index) => (
          <label key={field.id} className="admin-field">Etiqueta<input value={field.label} onChange={(e) => setFields(fields.map((item, i) => i === index ? { ...item, label: e.target.value } : item))} /></label>
        ))}
        <button className="admin-btn admin-btn--primary" type="submit">Guardar plantilla</button>
      </form>
      <div className="admin-table-wrap" style={{ marginTop: "1rem" }}>
        {rows.map((row) => <div key={String(row.id)} className="admin-table__row">{String(row.name)} · {String(row.form_type)} · v{String(row.version)}</div>)}
      </div>
    </>
  );
}

export function CommsAdmin() {
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [templates, setTemplates] = useState<Record<string, unknown>[]>([]);
  useEffect(() => {
    api<{ rows: Record<string, unknown>[] }>("/api/admin/messages").then((r) => setRows(r.rows));
    api<{ rows: Record<string, unknown>[] }>("/api/admin/settings/message-templates").then((r) => setTemplates(r.rows));
  }, []);
  return (
    <>
      <header className="admin-header"><p className="admin-header__eyebrow">Mensajes</p><h1 className="admin-header__title">Comunicaciones</h1><p className="admin-header__desc">Recordatorios por SMS (Twilio) y email (Resend o el correo del servidor).</p></header>
      <button className="admin-btn" type="button" onClick={() => api("/api/admin/messages", { method: "POST", body: JSON.stringify({ action: "dispatch" }) }).then(() => location.reload())}>Enviar cola</button>
      <h2 style={{ marginTop: "1rem" }}>Plantillas</h2>
      {templates.map((row) => <p key={String(row.id)}>{String(row.channel)} · {String(row.template_key)} · {String(row.subject || "")}</p>)}
      <div className="admin-table-wrap" style={{ marginTop: "1rem" }}>
        {rows.map((row) => <div key={String(row.id)} className="admin-table__row">{String(row.channel)} · {String(row.status)} · {String(row.subject || row.body || "")}</div>)}
      </div>
    </>
  );
}

export function ReportView({ slug }: { slug?: string }) {
  const [data, setData] = useState<{ rows: Record<string, unknown>[] } | null>(null);
  const active = slug || "citas";
  useEffect(() => { api<{ rows: Record<string, unknown>[] }>(`/api/admin/reports/${active}`).then(setData); }, [active]);
  const links = [["citas", "Citas"], ["ingresos", "Ingresos"], ["servicios", "Servicios"], ["profesionales", "Profesionales"], ["marketing", "Marketing"], ["no-shows", "No-shows"]];
  return (
    <>
      <header className="admin-header"><h1 className="admin-header__title">Reportes</h1></header>
      <nav className="admin-tabs">{links.map(([id, label]) => <a key={id} className={active === id ? "is-active" : ""} href={`/admin/reportes/${id}`}>{label}</a>)}</nav>
      <div className="admin-table-wrap">{(data?.rows || []).map((row, index) => <div key={index} className="admin-table__row">{Object.entries(row).map(([key, value]) => <span key={key}>{key}: {String(value)} </span>)}</div>)}</div>
    </>
  );
}

const SECTIONS = ["sedes", "salas", "servicios", "categorias", "equipo", "horarios", "impuestos", "pagos", "campos", "politicas", "facturacion"];
const MAP: Record<string, string> = { sedes: "locations", salas: "rooms", servicios: "services", categorias: "service-categories", equipo: "staff", horarios: "schedules", impuestos: "taxes", pagos: "payment-methods", campos: "custom-fields", politicas: "booking", facturacion: "clinic" };

export function SettingsManager({ section }: { section: string }) {
  const apiSection = MAP[section] || "locations";
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [raw, setRaw] = useState("{}");
  useEffect(() => { api<{ rows: Record<string, unknown>[] }>(`/api/admin/settings/${apiSection}`).then((r) => setRows(r.rows)).catch(() => setRows([])); }, [apiSection]);
  return (
    <>
      <header className="admin-header"><h1 className="admin-header__title">Configuración</h1></header>
      <nav className="admin-tabs">{SECTIONS.map((item) => <a key={item} className={section === item ? "is-active" : ""} href={`/admin/configuracion/${item}`}>{item}</a>)}</nav>
      <form onSubmit={async (e) => { e.preventDefault(); await api(`/api/admin/settings/${apiSection}`, { method: "POST", body: raw }); location.reload(); }}>
        <label className="admin-field">JSON del registro<textarea rows={8} value={raw} onChange={(e) => setRaw(e.target.value)} /></label>
        <button className="admin-btn admin-btn--primary" type="submit">Crear o guardar política</button>
      </form>
      <div className="admin-table-wrap" style={{ marginTop: "1rem" }}>
        {rows.map((row) => <pre key={String(row.id || row.key)} className="admin-table__row" style={{ whiteSpace: "pre-wrap" }}>{JSON.stringify(row, null, 2)}</pre>)}
      </div>
      <p className="admin-header__desc">Para el equipo, incluye email, firstName, lastName, password y roles: admin, doctor o reception. La verificación en dos pasos se activa en /api/admin/mfa.</p>
    </>
  );
}
