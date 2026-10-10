"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/components/admin/clinic/client";
import { useClinicScope } from "@/components/admin/clinic/ClinicScope";

type Sale = {
  id: string;
  sale_number: string;
  status: string;
  total: string | number;
  first_name?: string | null;
  last_name?: string | null;
  created_at?: string;
};

type Summary = { today: number; week: number; month: number; avg_ticket: number };
type IncomeRow = { day: string; total: number };

function money(value: number) {
  return `$${Number(value || 0).toFixed(2)}`;
}

export default function SalesOverview() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [days, setDays] = useState<IncomeRow[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<Record<string, unknown> | null>(null);
  const scope = useClinicScope();

  function load() {
    api<{ rows: Sale[]; summary: Summary }>(`/api/admin/sales?${scope.query}`)
      .then((result) => {
        setSales(result.rows);
        setSummary(result.summary);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "No se pudieron cargar las ventas."));
    api<{ rows: IncomeRow[] }>(`/api/admin/reports/ingresos?${scope.query}`)
      .then((result) => setDays((result.rows || []).slice(-7).reverse()))
      .catch(() => setDays([]));
  }

  useEffect(() => { load(); }, [scope.query]);

  const needle = query.trim().toLowerCase();
  const visible = sales.filter((sale) => {
    if (!needle) return true;
    const haystack = [
      sale.sale_number,
      sale.first_name,
      sale.last_name,
      sale.status,
      money(Number(sale.total || 0)),
    ].filter(Boolean).join(" ").toLowerCase();
    return haystack.includes(needle);
  });

  async function openSale(id: string) {
    setError(null);
    try {
      const result = await api<{ sale: Record<string, unknown> }>(`/api/admin/sales/${id}`);
      setOpen(result.sale);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo abrir la venta.");
    }
  }

  return (
    <>
      <header className="admin-header">
        <p className="admin-header__eyebrow">Dinero · {scope.label}</p>
        <h1 className="admin-header__title">Ventas</h1>
        <p className="admin-header__desc">Aquí ves cuánto se vendió. Para cobrar en mostrador, abre Cobrar.</p>
      </header>
      {error ? <div className="admin-alert" role="alert">{error}</div> : null}
      {message ? <p className="admin-notice" role="status">{message}</p> : null}
      <div className="admin-page-head">
        <h2 style={{ margin: 0, fontSize: "1.05rem" }}>Resumen</h2>
        <Link className="admin-btn admin-btn--primary" href="/admin/cobrar" data-tour="sales-charge">Cobrar</Link>
      </div>
      <section className="admin-metrics" data-tour="sales-metrics">
        <div className="admin-metric"><div className="admin-metric__value">{summary ? money(summary.today) : "—"}</div><div className="admin-metric__label">Hoy</div></div>
        <div className="admin-metric"><div className="admin-metric__value">{summary ? money(summary.week) : "—"}</div><div className="admin-metric__label">Esta semana</div></div>
        <div className="admin-metric"><div className="admin-metric__value">{summary ? money(summary.month) : "—"}</div><div className="admin-metric__label">Este mes</div></div>
        <div className="admin-metric"><div className="admin-metric__value">{summary ? money(summary.avg_ticket) : "—"}</div><div className="admin-metric__label">Ticket promedio del mes</div></div>
      </section>
      {days.length ? (
        <section className="admin-card" style={{ marginBottom: "1.25rem" }}>
          <h2 style={{ margin: "0 0 0.75rem", fontSize: "1.05rem" }}>Cobros por día</h2>
          {days.map((row) => (
            <p key={String(row.day)} className="admin-checkout__line">
              <span>{formatDay(row.day)}</span>
              <span>{money(Number(row.total))}</span>
            </p>
          ))}
        </section>
      ) : null}
      <section data-tour="sales-history">
        <h2 style={{ margin: "0 0 0.75rem", fontSize: "1.05rem" }}>Ventas recientes</h2>
        <label className="section-search">
          <span>Buscar ventas</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Folio, cliente, estado o monto" />
        </label>
        <div className="admin-table-wrap">
          {visible.map((sale) => (
            <div key={sale.id} className={`admin-table__row${open?.id === sale.id ? " is-open" : ""}`}>
              <button type="button" style={{ background: "transparent", border: 0, color: "inherit", font: "inherit", textAlign: "left", cursor: "pointer", padding: 0 }} onClick={() => void openSale(sale.id)}>
                <div className="admin-table__cell-title">{sale.sale_number}</div>
                <div className="admin-table__cell-sub">
                  {[sale.first_name, sale.last_name].filter(Boolean).join(" ") || "Mostrador"}
                  {" · "}
                  {sale.status === "void" ? "Anulada" : sale.status}
                  {" · "}
                  ${Number(sale.total || 0).toFixed(2)}
                  {sale.created_at ? ` · ${new Date(sale.created_at).toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short" })}` : ""}
                </div>
              </button>
              {sale.status !== "void" ? (
                <button className="admin-btn admin-btn--danger" type="button" onClick={async (event) => {
                  event.stopPropagation();
                  if (!window.confirm(`¿Anular ${sale.sale_number}? El registro se conserva, pero deja de contar como cobro.`)) return;
                  try {
                    await api(`/api/admin/sales/${sale.id}`, { method: "POST", body: JSON.stringify({ action: "void", reason: "Anulada en ventas" }) });
                    setMessage("Venta anulada.");
                    setSales(sales.map((item) => item.id === sale.id ? { ...item, status: "void" } : item));
                    load();
                  } catch (err) {
                    setMessage(err instanceof Error ? err.message : "No se pudo anular la venta.");
                  }
                }}>Anular</button>
              ) : null}
            </div>
          ))}
          {!sales.length ? <div className="admin-table__empty">Todavía no hay ventas. El primer cobro se hace en Cobrar.</div> : null}
          {sales.length > 0 && !visible.length ? <div className="admin-table__empty">Ninguna venta coincide con la búsqueda.</div> : null}
        </div>
        {open ? <SaleSheet sale={open} onClose={() => setOpen(null)} /> : null}
      </section>
    </>
  );
}

function SaleSheet({ sale, onClose }: { sale: Record<string, unknown>; onClose: () => void }) {
  const items = Array.isArray(sale.items) ? sale.items as Record<string, unknown>[] : [];
  const payments = Array.isArray(sale.payments) ? sale.payments as Record<string, unknown>[] : [];
  const invoice = sale.invoice as { invoice_number?: string } | null;
  return (
    <section className="admin-card sale-sheet" style={{ marginTop: "1rem" }}>
      <div className="admin-page-head">
        <h2 style={{ margin: 0, fontSize: "1.05rem" }}>{String(sale.sale_number || "Venta")}</h2>
        <button className="admin-btn" type="button" onClick={onClose}>Cerrar</button>
      </div>
      <p><span>Estado</span><span>{sale.status === "void" ? "Anulada" : String(sale.status || "—")}</span></p>
      <p><span>Total</span><span>{money(Number(sale.total || 0))}</span></p>
      {invoice?.invoice_number ? <p><span>Factura</span><span>{invoice.invoice_number}</span></p> : null}
      {items.map((item, index) => (
        <p key={String(item.id || index)}>
          <span>{String(item.description || item.name || "Concepto")} × {Number(item.quantity || 1)}</span>
          <span>{money(Number(item.line_total || item.total || 0))}</span>
        </p>
      ))}
      {payments.map((pay, index) => (
        <p key={index}><span>{String(pay.method_name || "Pago")}</span><span>{money(Number(pay.amount || 0))}</span></p>
      ))}
    </section>
  );
}

function formatDay(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("es-MX", { day: "numeric", month: "short" });
}
