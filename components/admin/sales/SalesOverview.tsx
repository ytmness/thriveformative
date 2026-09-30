"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/components/admin/clinic/client";

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

  function load() {
    api<{ rows: Sale[]; summary: Summary }>("/api/admin/sales")
      .then((result) => {
        setSales(result.rows);
        setSummary(result.summary);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "No se pudieron cargar las ventas."));
    api<{ rows: IncomeRow[] }>("/api/admin/reports/ingresos")
      .then((result) => setDays((result.rows || []).slice(-7).reverse()))
      .catch(() => setDays([]));
  }

  useEffect(() => { load(); }, []);

  return (
    <>
      <header className="admin-header">
        <p className="admin-header__eyebrow">Dinero</p>
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
        <div className="admin-table-wrap">
          {sales.map((sale) => (
            <div key={sale.id} className="admin-table__row">
              <div>
                <div className="admin-table__cell-title">{sale.sale_number}</div>
                <div className="admin-table__cell-sub">
                  {[sale.first_name, sale.last_name].filter(Boolean).join(" ") || "Mostrador"}
                  {" · "}
                  {sale.status === "void" ? "Anulada" : sale.status}
                  {" · "}
                  ${Number(sale.total || 0).toFixed(2)}
                  {sale.created_at ? ` · ${new Date(sale.created_at).toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short" })}` : ""}
                </div>
              </div>
              {sale.status !== "void" ? (
                <button className="admin-btn admin-btn--danger" type="button" onClick={async () => {
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
        </div>
      </section>
    </>
  );
}

function formatDay(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("es-MX", { day: "numeric", month: "short" });
}
