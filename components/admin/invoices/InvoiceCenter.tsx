"use client";

import { useEffect, useState } from "react";
import { api } from "@/components/admin/clinic/client";
import { CloseButton, EmptyState } from "@/components/admin/ui";
import { CreateOffer } from "@/components/admin/tutorial";

type Row = Record<string, unknown>;
type Detail = {
  kind: string;
  document: Row;
  items: Row[];
  payments: Row[];
};

function statusLabel(value: string) {
  const labels: Record<string, string> = {
    draft: "Borrador",
    issued: "Emitida",
    paid: "Pagada",
    partial: "Parcial",
    void: "Anulada",
    open: "Abierta",
    sent: "Enviada",
    accepted: "Aceptada",
    declined: "Rechazada",
    expired: "Vencida",
  };
  return labels[value] || value || "—";
}

function money(value: unknown) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "USD" }).format(Number(value || 0));
}

function when(value: unknown) {
  if (!value) return "—";
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" });
}

function person(row: Row) {
  const snapshot = row.billing_snapshot as { name?: string } | null;
  return [row.first_name, row.last_name].filter(Boolean).join(" ") || snapshot?.name || "Mostrador";
}

function place(row: Row) {
  return [row.street, row.city, row.state, row.postal_code].filter(Boolean).join(", ");
}

export function InvoiceCenter() {
  const [rows, setRows] = useState<Row[]>([]);
  const [kind, setKind] = useState("invoices");
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [opening, setOpening] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    setDetail(null);
    api<{ rows: Row[] }>(`/api/admin/invoices?kind=${kind === "invoices" ? "" : kind}`)
      .then((result) => setRows(result.rows))
      .catch((err) => setError(err.message));
  }, [kind]);

  async function openRow(id: string) {
    setOpening(true);
    setError(null);
    try {
      const result = await api<Detail>(`/api/admin/invoices?id=${id}&kind=${kind === "invoices" ? "" : kind}`);
      setDetail(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo abrir el documento.");
    } finally {
      setOpening(false);
    }
  }

  const title = kind === "quotes" ? "Cotización" : kind === "credits" ? "Nota de crédito" : "Factura";
  const needle = query.trim().toLowerCase();
  const visible = rows.filter((row) => {
    if (!needle) return true;
    const haystack = [
      row.invoice_number,
      row.quote_number,
      row.credit_number,
      person(row),
      statusLabel(String(row.status || "")),
      money(row.total || row.amount),
    ].filter(Boolean).join(" ").toLowerCase();
    return haystack.includes(needle);
  });

  return (
    <>
      <header className="admin-header">
        <p className="admin-header__eyebrow">Cobros</p>
        <h1 className="admin-header__title">Facturas y pagos</h1>
        <p className="admin-header__desc">Abre cualquier fila para ver el documento, con conceptos, impuestos y lo pagado.</p>
      </header>
      {error ? <div className="admin-alert">{error}</div> : null}
      <nav className="admin-nav admin-nav--row" data-tour="invoice-tabs" aria-label="Documentos">
        {[["invoices", "Facturas"], ["quotes", "Cotizaciones"], ["credits", "Notas de crédito"]].map(([id, label]) => (
          <button key={id} className={`admin-nav__item${kind === id ? " admin-nav__item--active" : ""}`} type="button" aria-pressed={kind === id} onClick={() => setKind(id)}>{label}</button>
        ))}
      </nav>
      {kind !== "invoices" ? (
        <form className="admin-toolbar" data-tour="invoice-form" onSubmit={async (event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
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
      <label className="section-search">
        <span>Buscar documentos</span>
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Número, paciente, estado o monto" />
      </label>
      <div className="admin-table-wrap" data-tour="invoice-table">
        <div className="admin-table__row admin-table__head invoice-list"><span>Número</span><span>Paciente</span><span>Fecha</span><span>Estado</span><span>Total</span><span /></div>
        {visible.map((row) => (
          <button key={String(row.id)} className="admin-table__row invoice-list" type="button" onClick={() => openRow(String(row.id))}>
            <span className="admin-table__cell-title">{String(row.invoice_number || row.quote_number || row.credit_number || "—")}</span>
            <span>{person(row)}</span>
            <span>{when(row.issued_at || row.created_at)}</span>
            <span>{statusLabel(String(row.status || "issued"))}</span>
            <span>{money(row.total || row.amount)}</span>
            <span className="invoice-list__open">Abrir</span>
          </button>
        ))}
        {!rows.length ? <EmptyState title={kind === "quotes" ? "Sin cotizaciones" : kind === "credits" ? "Sin notas de crédito" : "Sin facturas"} text="Se crean al cobrar." action={<CreateOffer show={kind === "invoices"} kind="sale" href="/admin/cobrar" />} /> : null}
        {rows.length > 0 && !visible.length ? <p className="admin-table__empty">Ningún documento coincide con la búsqueda.</p> : null}
      </div>
      {opening || detail ? (
        <div className="admin-drawer invoice-overlay" onClick={() => setDetail(null)}>
          <div className="invoice-stage" onClick={(event) => event.stopPropagation()}>
            <div className="invoice-stage__tools">
              <button className="admin-btn" type="button" onClick={() => window.print()}>Imprimir</button>
              <CloseButton onClick={() => setDetail(null)} />
            </div>
            {opening || !detail ? <p className="invoice-sheet">Abriendo…</p> : <InvoiceSheet title={title} detail={detail} />}
          </div>
        </div>
      ) : null}
    </>
  );
}

function InvoiceSheet({ title, detail }: { title: string; detail: Detail }) {
  const doc = detail.document;
  const items = detail.items;
  const paid = Number(doc.collected ?? doc.paid_total ?? 0);
  const total = Number(doc.total || doc.amount || 0);
  const balance = Math.max(0, total - paid);
  const address = place(doc);
  return (
    <article className="invoice-sheet">
      <header className="invoice-sheet__top">
        <div>
          <p className="invoice-sheet__brand">Thrive Formative</p>
          <p className="invoice-sheet__place">{String(doc.location_name || "Clínica")}</p>
          {address ? <p className="invoice-sheet__place">{address}</p> : null}
          {doc.location_phone ? <p className="invoice-sheet__place">{String(doc.location_phone)}</p> : null}
        </div>
        <div className="invoice-sheet__meta">
          <p className="invoice-sheet__kind">{title}</p>
          <p className="invoice-sheet__number">{String(doc.invoice_number || doc.quote_number || doc.credit_number)}</p>
          <p>{when(doc.issued_at || doc.created_at)}</p>
          <p className="invoice-sheet__status">{statusLabel(String(doc.status || (detail.kind === "credit" ? "issued" : "open")))}</p>
        </div>
      </header>
      <section className="invoice-sheet__who">
        <div>
          <p className="invoice-sheet__label">Para</p>
          <p className="invoice-sheet__who-name">{person(doc)}</p>
          {doc.client_code ? <p className="invoice-sheet__place">Expediente {String(doc.client_code)}</p> : null}
        </div>
        {doc.invoice_number && detail.kind === "credit" ? (
          <div>
            <p className="invoice-sheet__label">Aplica a</p>
            <p>{String(doc.invoice_number)}</p>
          </div>
        ) : null}
      </section>
      {detail.kind === "credit" ? (
        <p className="invoice-sheet__reason">{String(doc.reason || "Sin motivo indicado.")}</p>
      ) : (
        <table className="invoice-sheet__lines">
          <thead>
            <tr><th>Concepto</th><th>Cant.</th><th>Precio</th><th>Importe</th></tr>
          </thead>
          <tbody>
            {items.length ? items.map((item) => (
              <tr key={String(item.id)}>
                <td>{String(item.description)}</td>
                <td>{Number(item.quantity || 1)}</td>
                <td>{money(item.unit_price)}</td>
                <td>{money(item.line_total)}</td>
              </tr>
            )) : (
              <tr><td>{String(doc.notes || title)}</td><td>1</td><td>{money(total)}</td><td>{money(total)}</td></tr>
            )}
          </tbody>
        </table>
      )}
      <footer className="invoice-sheet__totals">
        {detail.kind !== "credit" ? (
          <>
            <p><span>Subtotal</span><span>{money(doc.subtotal ?? total)}</span></p>
            <p><span>Impuestos</span><span>{money(doc.tax_total)}</span></p>
            {Number(doc.discount_total || 0) > 0 ? <p><span>Descuento</span><span>−{money(doc.discount_total)}</span></p> : null}
          </>
        ) : null}
        <p className="invoice-sheet__grand"><span>Total</span><span>{money(total)}</span></p>
        {detail.kind === "invoice" ? (
          <>
            <p><span>Pagado</span><span>{money(paid)}</span></p>
            <p><span>Saldo</span><span>{money(balance)}</span></p>
          </>
        ) : null}
      </footer>
      {detail.payments.length ? (
        <ul className="invoice-sheet__pays">
          {detail.payments.map((pay, index) => (
            <li key={index}>{String(pay.method_name || "Pago")} · {money(pay.amount)} · {when(pay.received_at || pay.created_at)}</li>
          ))}
        </ul>
      ) : null}
    </article>
  );
}
