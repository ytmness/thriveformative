"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { api } from "@/components/admin/clinic/client";

type Order = {
  id: string;
  kind: "cita" | "consulta" | "online";
  title: string;
  detail: string;
  status: string;
  at: string;
  amount: number | null;
  currency: string | null;
  minor: boolean;
  receiptUrl: string | null;
};
type Invoice = { id: string; invoice_number: string; status: string; total: number };
type Home = {
  patient: { name: string; email: string };
  orders: Order[];
  invoices: Invoice[];
};

const STATUS: Record<string, string> = {
  booked: "Reservada",
  confirmed: "Confirmada",
  arrived: "Llegó",
  completed: "Completada",
  cancelled: "Cancelada",
  paid: "Pagado",
  ready: "Listo",
  open: "Abierta",
  partial: "Pago parcial",
  void: "Anulada",
};
const KIND: Record<Order["kind"], string> = {
  cita: "Cita",
  consulta: "Consulta",
  online: "Pedido en línea",
};

export default function AccountHome() {
  const locale = useLocale();
  const [home, setHome] = useState<Home | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<Home>("/api/account")
      .then(setHome)
      .catch(() => {
        window.location.href = `/${locale}/login`;
      });
  }, [locale]);

  if (!home) return <p className="booking-slots__empty">{error || "Cargando tu cuenta…"}</p>;

  function money(row: Order) {
    if (row.amount == null) return "";
    const value = row.minor ? row.amount / 100 : row.amount;
    return value.toLocaleString(locale, { style: "currency", currency: row.currency || "MXN" });
  }

  async function cancel(row: Order) {
    if (row.kind !== "cita" || !window.confirm("¿Cancelar esta cita?")) return;
    setError(null);
    try {
      await api("/api/portal/appointments", { method: "POST", body: JSON.stringify({ appointmentId: row.id.slice("cita:".length), action: "cancel" }) });
      setHome({
        ...home!,
        orders: home!.orders.map((item) => (item.id === row.id ? { ...item, status: "cancelled" } : item)),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cancelar.");
    }
  }

  return (
    <div className="account-home">
      <p className="visit-sheet__eyebrow">Tu cuenta</p>
      <h1 className="type-page-title">{home.patient.name || "Hola"}</h1>
      <p className="visit-sheet__when">{home.patient.email}</p>
      {error ? <p className="booking-error" role="alert">{error}</p> : null}

      <section id="ordenes">
        <h2>Órdenes</h2>
        {home.orders.length ? home.orders.map((row) => (
          <div key={row.id} className="account-row">
            <div>
              <strong>{KIND[row.kind]} · {row.title}</strong>
              <p>
                {new Date(row.at).toLocaleString(locale, { dateStyle: "medium", timeStyle: "short" })}
                {row.detail ? ` · ${row.detail}` : ""}
                {" · "}
                {STATUS[row.status] || row.status}
                {row.amount != null ? ` · ${money(row)}` : ""}
              </p>
            </div>
            <div className="account-row__actions">
              {row.receiptUrl ? <a href={row.receiptUrl}>Recibo</a> : null}
              {row.kind === "cita" && row.status !== "cancelled" && row.status !== "completed" ? (
                <button type="button" className="booking-form__submit" onClick={() => void cancel(row)}>Cancelar</button>
              ) : null}
            </div>
          </div>
        )) : <p className="booking-slots__empty">No hay citas, consultas ni pedidos en línea en esta cuenta.</p>}
      </section>

      <section id="facturas">
        <h2>Facturas</h2>
        {home.invoices.length ? home.invoices.map((row) => (
          <div key={row.id} className="account-row">
            <div>
              <strong>{row.invoice_number}</strong>
              <p>{STATUS[row.status] || row.status} · ${Number(row.total || 0).toFixed(2)}</p>
            </div>
          </div>
        )) : <p className="booking-slots__empty">No hay facturas de la clínica.</p>}
      </section>
    </div>
  );
}
