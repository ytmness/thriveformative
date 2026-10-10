"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { api } from "@/components/admin/clinic/client";

type Visit = {
  id: string;
  starts_at: string;
  status: string;
  service_name: string | null;
  location_name: string | null;
  first_name: string | null;
  last_name: string | null;
};
type Order = {
  id: string;
  status: string;
  fulfillment: string;
  currency: string;
  total_amount: number;
  created_at: string;
  receipt_url: string | null;
};
type Invoice = { id: string; invoice_number: string; status: string; total: number };
type Home = {
  patient: { name: string; email: string };
  appointments: Visit[];
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

  async function cancel(id: string) {
    if (!window.confirm("¿Cancelar esta cita?")) return;
    setError(null);
    try {
      await api("/api/portal/appointments", { method: "POST", body: JSON.stringify({ appointmentId: id, action: "cancel" }) });
      setHome({
        ...home!,
        appointments: home!.appointments.map((row) => (row.id === id ? { ...row, status: "cancelled" } : row)),
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

      <section id="citas">
        <h2>Citas</h2>
        {home.appointments.length ? home.appointments.map((row) => (
          <div key={row.id} className="account-row">
            <div>
              <strong>{row.service_name || "Cita"}</strong>
              <p>
                {new Date(row.starts_at).toLocaleString(locale, { dateStyle: "medium", timeStyle: "short" })}
                {" · "}
                {[row.first_name, row.last_name].filter(Boolean).join(" ")}
                {row.location_name ? ` · ${row.location_name}` : ""}
                {" · "}
                {STATUS[row.status] || row.status}
              </p>
            </div>
            {row.status === "cancelled" || row.status === "completed" ? null : (
              <button type="button" className="booking-form__submit" onClick={() => void cancel(row.id)}>Cancelar</button>
            )}
          </div>
        )) : <p className="booking-slots__empty">Todavía no hay citas en esta cuenta.</p>}
      </section>

      <section id="pedidos">
        <h2>Pedidos</h2>
        {home.orders.length ? home.orders.map((row) => (
          <div key={row.id} className="account-row">
            <div>
              <strong>{row.fulfillment === "shipping" ? "Envío" : "Recoger en sede"}</strong>
              <p>
                {new Date(row.created_at).toLocaleDateString(locale)}
                {" · "}
                {STATUS[row.status] || row.status}
                {" · "}
                {(row.total_amount / 100).toLocaleString(locale, { style: "currency", currency: row.currency || "USD" })}
              </p>
            </div>
            {row.receipt_url ? <a href={row.receipt_url}>Recibo</a> : null}
          </div>
        )) : <p className="booking-slots__empty">No hay pedidos de la tienda con este correo.</p>}
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
