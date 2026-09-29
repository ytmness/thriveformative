"use client";

import { useEffect, useState } from "react";
import { api } from "@/components/admin/clinic/client";

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
      <div className="admin-tabs">
        {[["invoices", "Facturas"], ["quotes", "Cotizaciones"], ["credits", "Notas de crédito"]].map(([id, label]) => <button key={id} className={kind === id ? "is-active" : ""} type="button" onClick={() => setKind(id)}>{label}</button>)}
      </div>
      {kind !== "invoices" ? (
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
          <input name="desc" placeholder={kind === "quotes" ? "Descripción" : "Motivo"} required />
          <input name="amount" type="number" step="0.01" placeholder="Monto" required />
          {kind === "credits" ? <input name="invoice" placeholder="ID de factura" required /> : null}
          <button className="admin-btn admin-btn--primary" type="submit">{kind === "quotes" ? "Nueva cotización" : "Nota de crédito"}</button>
        </form>
      ) : null}
      <div className="admin-table-wrap">
        <div className="admin-table__row admin-table__head"><span>Número</span><span>Paciente</span><span>Estado</span><span>Total</span></div>
        {rows.map((row) => (
          <div key={String(row.id)} className="admin-table__row">
            <div className="admin-table__cell-title">{String(row.invoice_number || row.quote_number || row.credit_number || "—")}</div>
            <div>{[row.first_name, row.last_name].filter(Boolean).join(" ") || "—"}</div>
            <div>{statusLabel(String(row.status || ""))}</div>
            <div>${Number(row.total || row.amount || 0).toFixed(2)}</div>
          </div>
        ))}
        {!rows.length ? <div className="admin-table__empty">{kind === "quotes" ? "No hay cotizaciones." : kind === "credits" ? "No hay notas de crédito." : "No hay facturas emitidas. Se crean al cobrar en Ventas."}</div> : null}
      </div>
    </>
  );
}

export function ProductAdmin() {
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [moves, setMoves] = useState<Record<string, unknown>[]>([]);
  const [locations, setLocations] = useState<{ id: string; name: string }[]>([]);
  const [suppliers, setSuppliers] = useState<{ id: string; name: string }[]>([]);
  const [form, setForm] = useState({ name: "", sku: "", barcode: "", sizeLabel: "", price: "", cost: "", description: "", supplierId: "" });
  const [supplierName, setSupplierName] = useState("");
  const [stock, setStock] = useState({ productId: "", locationId: "", quantity: "", reason: "Ajuste" });
  useEffect(() => {
    api<{ rows: Record<string, unknown>[] }>("/api/admin/products").then((r) => setRows(r.rows));
    api<{ rows: Record<string, unknown>[] }>("/api/admin/products?kind=movements").then((r) => setMoves(r.rows)).catch(() => undefined);
    api<{ rows: { id: string; name: string }[] }>("/api/admin/settings/locations").then((r) => setLocations(r.rows)).catch(() => undefined);
    api<{ rows: { id: string; name: string }[] }>("/api/admin/settings/suppliers").then((r) => setSuppliers(r.rows)).catch(() => undefined);
  }, []);
  return (
    <>
      <header className="admin-header"><p className="admin-header__eyebrow">Inventario</p><h1 className="admin-header__title">Productos</h1></header>
      <div className="admin-toolbar">
        <button type="button" className="admin-btn" onClick={() => { window.location.href = "/api/admin/products?export=1&format=csv"; }}>CSV</button>
        <button type="button" className="admin-btn" onClick={() => { window.location.href = "/api/admin/products?export=1&format=xlsx"; }}>Excel</button>
      </div>
      <form className="admin-form-grid" onSubmit={async (e) => { e.preventDefault(); await api("/api/admin/products", { method: "POST", body: JSON.stringify({ ...form, price: Number(form.price || 0), cost: Number(form.cost || 0) }) }); location.reload(); }}>
        <label className="admin-field">Nombre<input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
        <label className="admin-field">SKU<input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} /></label>
        <label className="admin-field">Código de barras<input value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} /></label>
        <label className="admin-field">Tamaño<input value={form.sizeLabel} onChange={(e) => setForm({ ...form, sizeLabel: e.target.value })} /></label>
        <label className="admin-field">Costo<input value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} /></label>
        <label className="admin-field">Precio<input value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></label>
        <label className="admin-field">Proveedor<select value={form.supplierId} onChange={(e) => setForm({ ...form, supplierId: e.target.value })}><option value="">—</option>{suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
        <label className="admin-field span-2">Descripción<textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label>
        <button className="admin-btn admin-btn--primary" type="submit">Guardar producto</button>
      </form>
      <form className="admin-toolbar" style={{ marginTop: "1rem" }} onSubmit={async (e) => { e.preventDefault(); await api("/api/admin/settings/suppliers", { method: "POST", body: JSON.stringify({ name: supplierName }) }); setSupplierName(""); location.reload(); }}>
        <input value={supplierName} onChange={(e) => setSupplierName(e.target.value)} placeholder="Nuevo proveedor" required />
        <button className="admin-btn" type="submit">Agregar proveedor</button>
      </form>
      <div className="admin-table-wrap" style={{ marginTop: "1rem" }}>
        <div className="admin-table__row admin-table__head"><span>Producto</span><span>SKU</span><span>Precio</span><span>Stock</span></div>
        {rows.map((row) => {
          const stockRows = (row.stock as { quantity: number; location_name: string }[]) || [];
          return (
            <div key={String(row.id)} className="admin-table__row">
              <div className="admin-table__cell-title">{String(row.name)}{row.lowStock ? " · stock bajo" : ""}</div>
              <div>{String(row.sku || "—")}</div>
              <div>${Number(row.price || 0).toFixed(2)}</div>
              <div>{stockRows.length ? stockRows.map((item) => `${item.location_name}: ${item.quantity}`).join(" · ") : "Sin existencias"}</div>
            </div>
          );
        })}
        {!rows.length ? <div className="admin-table__empty">No hay productos. Crea el primero con el formulario.</div> : null}
      </div>
      <h2 style={{ marginTop: "1.5rem" }}>Ajuste de inventario</h2>
      <form className="admin-toolbar" onSubmit={async (e) => { e.preventDefault(); await api("/api/admin/products", { method: "POST", body: JSON.stringify({ kind: "stock", productId: stock.productId, locationId: stock.locationId, quantity: Number(stock.quantity), movementType: "adjust", reason: stock.reason }) }); location.reload(); }}>
        <select required value={stock.productId} onChange={(e) => setStock({ ...stock, productId: e.target.value })}><option value="">Producto</option>{rows.map((row) => <option key={String(row.id)} value={String(row.id)}>{String(row.name)}</option>)}</select>
        <select required value={stock.locationId} onChange={(e) => setStock({ ...stock, locationId: e.target.value })}><option value="">Sede</option>{locations.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}</select>
        <input required type="number" step="1" placeholder="Cantidad (+/−)" value={stock.quantity} onChange={(e) => setStock({ ...stock, quantity: e.target.value })} />
        <input value={stock.reason} onChange={(e) => setStock({ ...stock, reason: e.target.value })} placeholder="Motivo" />
        <button className="admin-btn admin-btn--primary" type="submit">Registrar movimiento</button>
      </form>
      <div className="admin-table-wrap" style={{ marginTop: "1rem" }}>
        <div className="admin-table__row admin-table__head"><span>Movimiento</span><span>Producto</span><span>Sede</span><span>Cantidad</span></div>
        {moves.map((row) => (
          <div key={String(row.id)} className="admin-table__row">
            <div>{String(row.movement_type)}</div>
            <div>{String(row.product_name)}</div>
            <div>{String(row.location_name)}</div>
            <div>{String(row.quantity)} · {String(row.reason || "")}</div>
          </div>
        ))}
        {!moves.length ? <div className="admin-table__empty">Sin movimientos de inventario.</div> : null}
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
      <form className="admin-form-grid" onSubmit={async (e) => {
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
          <button className="admin-btn admin-btn--primary" type="submit">{templateId ? "Guardar cambios" : "Guardar plantilla"}</button>
          {templateId ? <button className="admin-btn" type="button" onClick={reset}>Nueva plantilla</button> : null}
        </div>
      </form>
      <div className="admin-table-wrap" style={{ marginTop: "1rem" }}>
        <div className="admin-table__row admin-table__head"><span>Plantilla</span><span>Tipo</span><span>Versión</span></div>
        {rows.map((row) => (
          <button key={String(row.id)} type="button" className="admin-table__row" onClick={() => {
            setTemplateId(String(row.id));
            setName(String(row.name || ""));
            setFormType(String(row.form_type || "custom"));
            setFields(Array.isArray(row.schema) ? row.schema as { id: string; label: string; type: string; required: boolean }[] : []);
            setNotice(`Editando «${String(row.name || "plantilla")}».`);
            setError(null);
          }}>
            <div>{String(row.name)}</div><div>{String(row.form_type)}{row.requires_signature ? " · con firma" : ""}</div><div>v{String(row.version)}</div>
          </button>
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
  useEffect(() => {
    api<{ rows: Record<string, unknown>[] }>("/api/admin/messages").then((r) => setRows(r.rows));
    api<{ rows: Record<string, unknown>[] }>("/api/admin/settings/message-templates").then((r) => setTemplates(r.rows));
  }, []);
  return (
    <>
      <header className="admin-header"><p className="admin-header__eyebrow">Mensajes</p><h1 className="admin-header__title">Comunicaciones</h1><p className="admin-header__desc">Recordatorios por SMS y email. Variables: {"{{nombre}}"}, {"{{servicio}}"}, {"{{fecha}}"}, {"{{hora}}"}, {"{{sede}}"}.</p></header>
      <button className="admin-btn" type="button" onClick={() => api("/api/admin/messages", { method: "POST", body: JSON.stringify({ action: "dispatch" }) }).then(() => location.reload())}>Enviar cola pendiente</button>
      <h2 style={{ marginTop: "1.25rem" }}>Plantillas</h2>
      <div className="admin-table-wrap">
        {templates.map((row) => (
          <button key={String(row.id)} type="button" className="admin-table__row" onClick={() => setDraft(row)}>
            <div className="admin-table__cell-title">{String(row.channel) === "sms" ? "SMS" : "Email"} · {String(row.template_key)}</div>
            <div className="admin-table__cell-sub">{String(row.body || row.subject || "Sin texto")}</div>
          </button>
        ))}
        {!templates.length ? <div className="admin-table__empty">No hay plantillas.</div> : null}
      </div>
      {draft ? (
        <form className="admin-form-grid" style={{ marginTop: "1rem" }} onSubmit={async (e) => {
          e.preventDefault();
          await api(`/api/admin/settings/message-templates/${draft.id}`, { method: "PATCH", body: JSON.stringify({ channel: draft.channel, templateKey: draft.template_key, locale: draft.locale || "es", subject: draft.subject, body: draft.body, isActive: draft.is_active !== false }) });
          setDraft(null);
          location.reload();
        }}>
          <label className="admin-field">Asunto<input value={String(draft.subject || "")} onChange={(e) => setDraft({ ...draft, subject: e.target.value })} /></label>
          <label className="admin-field span-2">Mensaje<textarea required rows={5} value={String(draft.body || "")} onChange={(e) => setDraft({ ...draft, body: e.target.value })} /></label>
          <button className="admin-btn admin-btn--primary" type="submit">Guardar plantilla</button>
        </form>
      ) : null}
      <h2 style={{ marginTop: "1.25rem" }}>Cola</h2>
      <div className="admin-table-wrap">
        <div className="admin-table__row admin-table__head"><span>Canal</span><span>Estado</span><span>Texto</span></div>
        {rows.map((row) => <div key={String(row.id)} className="admin-table__row"><div>{String(row.channel)}</div><div>{String(row.status)}</div><div>{String(row.body || row.subject || "")}</div></div>)}
        {!rows.length ? <div className="admin-table__empty">La cola está vacía. Los recordatorios se crean al agendar una cita.</div> : null}
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
      <nav className="admin-tabs admin-tabs--wrap">{links.map(([id, label]) => <a key={id} className={active === id ? "is-active" : ""} href={`/admin/reportes/${id}`}>{label}</a>)}</nav>
      <div className="admin-table-wrap">
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

