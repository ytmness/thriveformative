"use client";

import { useEffect, useState } from "react";
import { api } from "@/components/admin/clinic/client";
import StoreReceipt from "@/components/store/StoreReceipt";
import type { StoreReceiptData } from "@/lib/store/orderTypes";
import "@/app/styles/tienda.css";

type Row = {
  id: string;
  status: string;
  fulfillment: string;
  recipient_name: string;
  currency: string;
  total_amount: number;
  location_name: string | null;
  city: string | null;
  created_at: string;
};

type Detail = StoreReceiptData & { id: string; status: string; receiptUrl: string | null };

const STATUS: Record<string, string> = {
  paid: "Pagado",
  ready: "Listo",
  completed: "Entregado",
  cancelled: "Cancelado",
};

function money(amount: number, currency: string) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: currency || "USD" }).format(amount / 100);
}

const receiptLabels = {
  receiptTitle: "Recibo",
  totalPaid: "Total pagado",
  thanksOrder: "Gracias por tu pedido.",
  processingOrder: "Procesando tu pedido",
  printingReceipt: "Imprimiendo tu recibo",
  orderComplete: "Pedido completado",
  pickup: "Recoger en sede",
  shipping: "Envío",
  home: "Inicio",
};

export default function StoreOrdersPanel() {
  const [rows, setRows] = useState<Row[]>([]);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [error, setError] = useState<string | null>(null);

  function load() {
    api<{ rows: Row[] }>("/api/admin/store/orders")
      .then((result) => setRows(result.rows))
      .catch((err) => setError(err instanceof Error ? err.message : "No se pudieron cargar los pedidos."));
  }

  useEffect(() => {
    load();
  }, []);

  async function open(id: string) {
    setError(null);
    try {
      const result = await api<{ order: Detail }>(`/api/admin/store/orders/${id}`);
      setDetail(result.order);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo abrir el pedido.");
    }
  }

  async function setStatus(status: string) {
    if (!detail) return;
    try {
      await api(`/api/admin/store/orders/${detail.id}`, { method: "POST", body: JSON.stringify({ status }) });
      setDetail({ ...detail, status });
      setRows(rows.map((row) => (row.id === detail.id ? { ...row, status } : row)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo actualizar el pedido.");
    }
  }

  return (
    <>
      <header className="admin-header">
        <p className="admin-header__eyebrow">Dinero</p>
        <h1 className="admin-header__title">Pedidos en línea</h1>
        <p className="admin-header__desc">Pedidos pagados en la tienda. Elige uno para ver el recibo y marcar la entrega.</p>
      </header>
      {error ? <div className="admin-alert" role="alert">{error}</div> : null}
      <div className="admin-table-wrap">
        {rows.length === 0 ? <p className="admin-table__empty">Todavía no hay pedidos de la tienda.</p> : null}
        {rows.map((row) => (
          <button key={row.id} className="admin-table__row" type="button" style={{ width: "100%", border: 0, background: "transparent", color: "inherit", font: "inherit", cursor: "pointer" }} onClick={() => void open(row.id)}>
            <div>
              <div className="admin-table__cell-title">{row.recipient_name}</div>
              <div className="admin-table__cell-sub">
                {row.fulfillment === "pickup" ? row.location_name || "Recoger" : `Envío${row.city ? ` · ${row.city}` : ""}`}
                {" · "}
                {STATUS[row.status] || row.status}
                {" · "}
                {money(row.total_amount, row.currency)}
                {" · "}
                {new Date(row.created_at).toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short" })}
              </div>
            </div>
          </button>
        ))}
      </div>
      {detail ? (
        <section className="admin-card admin-receipt">
          <div className="admin-toolbar">
            <button className="admin-btn" type="button" onClick={() => setStatus("ready")}>Listo para recoger</button>
            <button className="admin-btn admin-btn--primary" type="button" onClick={() => setStatus("completed")}>Entregado</button>
            <button className="admin-btn" type="button" onClick={() => setStatus("cancelled")}>Cancelado</button>
            <button className="admin-btn" type="button" onClick={() => setDetail(null)}>Cerrar</button>
          </div>
          <p className="admin-notice" role="status">{STATUS[detail.status] || detail.status}</p>
          <StoreReceipt data={detail} animate={false} labels={receiptLabels} homeHref="/admin/tienda/pedidos" />
        </section>
      ) : null}
    </>
  );
}
