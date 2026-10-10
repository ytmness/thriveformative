"use client";

import { useEffect, useState } from "react";
import { api } from "@/components/admin/clinic/client";
import { OrderTrack, type OrderStage } from "@/components/store/OrderTrack";
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
  const [query, setQuery] = useState("");
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

  async function setStatus(status: OrderStage) {
    if (!detail) return;
    try {
      await api(`/api/admin/store/orders/${detail.id}`, { method: "POST", body: JSON.stringify({ status }) });
      setDetail({ ...detail, status });
      setRows(rows.map((row) => (row.id === detail.id ? { ...row, status } : row)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo actualizar el pedido.");
    }
  }

  const needle = query.trim().toLowerCase();
  const visible = rows.filter((row) => {
    if (!needle) return true;
    const haystack = [
      row.recipient_name,
      row.location_name,
      row.city,
      STATUS[row.status] || row.status,
      money(row.total_amount, row.currency),
    ].filter(Boolean).join(" ").toLowerCase();
    return haystack.includes(needle);
  });

  return (
    <>
      <header className="admin-header">
        <p className="admin-header__eyebrow">Dinero</p>
        <h1 className="admin-header__title">Pedidos en línea</h1>
        <p className="admin-header__desc">Pedidos pagados en la tienda. Elige uno para ver el recibo y marcar la entrega.</p>
      </header>
      {error ? <div className="admin-alert" role="alert">{error}</div> : null}
      <label className="section-search">
        <span>Buscar pedidos</span>
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Nombre, sede, estado o monto" />
      </label>
      <div className="admin-table-wrap">
        {rows.length === 0 ? <p className="admin-table__empty">Todavía no hay pedidos de la tienda.</p> : null}
        {visible.length === 0 && rows.length > 0 ? <p className="admin-table__empty">Ningún pedido coincide con la búsqueda.</p> : null}
        {visible.map((row) => (
          <button key={row.id} className={`admin-table__row${detail?.id === row.id ? " is-open" : ""}`} type="button" onClick={() => void open(row.id)}>
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
        <div className="order-desk">
          <OrderTrack
            status={detail.status}
            fulfillment={detail.fulfillment}
            onSelect={(status) => void setStatus(status)}
            onClose={() => setDetail(null)}
            labels={{
              title: "Etapas del pedido",
              paid: "Pagado",
              readyPickup: "Listo para recoger",
              readyShip: "En camino",
              completed: "Entregado",
              cancelled: "Cancelado",
              paidNote: "El pago ya está registrado.",
              readyPickupNote: "El cliente puede pasar por la sede.",
              readyShipNote: "El pedido va en camino.",
              completedNote: "El pedido ya se entregó.",
              cancelledNote: "Este pedido se canceló.",
              cancel: "Cancelar pedido",
              close: "Cerrar",
              hint: "Toca una etapa para cambiar el estado. El cliente recibe un correo.",
            }}
          />
          <div className="order-desk__receipt">
            <StoreReceipt data={detail} animate={false} labels={receiptLabels} homeHref="/admin/tienda/pedidos" />
          </div>
        </div>
      ) : null}
    </>
  );
}
