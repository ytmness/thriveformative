"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { api } from "@/components/admin/clinic/client";
import { PatientAvatar } from "@/components/PatientAvatar";

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
type Credit = {
  serviceId: string;
  serviceName: string;
  remaining: number;
  allotted: number;
  membershipName: string;
  periodStart: string;
  periodEnd: string;
  clockPending?: boolean;
};
type Home = {
  patient: { name: string; email: string; profilePhotoUrl?: string | null };
  orders: Order[];
  invoices: Invoice[];
  credits?: Credit[];
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
  const t = useTranslations("account");
  const [home, setHome] = useState<Home | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api<Home>("/api/account")
      .then(setHome)
      .catch(() => {
        window.location.href = `/${locale}/login`;
      });
  }, [locale]);

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploading(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append("file", file);
      
      const uploadRes = await fetch("/api/upload-profile-photo", {
        method: "POST",
        body: formData,
      });
      
      if (!uploadRes.ok) {
        const errorData = await uploadRes.json();
        throw new Error(errorData.error || "Error subiendo foto");
      }
      
      const { url } = await uploadRes.json();
      
      await api("/api/account/update-photo", {
        method: "POST",
        body: JSON.stringify({ photoUrl: url }),
      });
      
      const updated = await api<Home>("/api/account");
      setHome(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error subiendo foto");
    } finally {
      setUploading(false);
    }
  }

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
      setHome(await api<Home>("/api/account"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cancelar.");
    }
  }

  const nameParts = home.patient.name.split(" ");
  const firstName = nameParts[0] || "Paciente";
  const lastName = nameParts.slice(1).join(" ") || "";

  return (
    <div className="account-home">
      <div style={{ display: "flex", alignItems: "start", gap: "1.5rem", marginBottom: "1.5rem" }}>
        <div style={{ position: "relative" }}>
          <PatientAvatar 
            firstName={firstName}
            lastName={lastName}
            photoUrl={home.patient.profilePhotoUrl}
            size="large"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            style={{
              position: "absolute",
              bottom: 0,
              right: 0,
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              backgroundColor: "rgb(var(--primary))",
              color: "white",
              border: "2px solid white",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "14px",
            }}
            aria-label="Cambiar foto de perfil"
          >
            {uploading ? "..." : "📷"}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handlePhotoUpload}
            style={{ display: "none" }}
          />
        </div>
        <div>
          <p className="visit-sheet__eyebrow">Tu cuenta</p>
          <h1 className="type-page-title">{home.patient.name || "Hola"}</h1>
          <p className="visit-sheet__when">{home.patient.email}</p>
        </div>
      </div>
      {error ? <p className="booking-error" role="alert">{error}</p> : null}

      <section id="plan">
        <h2>{t("plan")}</h2>
        {home.credits?.length ? home.credits.map((credit) => (
          <div key={`${credit.serviceId}-${credit.periodEnd}`} className="account-row">
            <div>
              <strong>{credit.serviceName}</strong>
              <p>
                {t("creditsLeft", { remaining: credit.remaining, allotted: credit.allotted, service: credit.serviceName })}
                {credit.membershipName ? ` · ${credit.membershipName}` : ""}
                {credit.clockPending
                  ? ` · ${t("planStartsOnFirstVisit")}`
                  : credit.periodEnd
                    ? ` · ${t("planUntil", { date: new Date(`${credit.periodEnd.slice(0, 10)}T12:00:00`).toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" }) })}`
                    : ""}
              </p>
            </div>
            <span className="booking-plan__count">{credit.remaining}/{credit.allotted}</span>
          </div>
        )) : <p className="booking-slots__empty">{t("planEmpty")}</p>}
      </section>

      <section id="gestionar">
        <h2>{t("manage")}</h2>
        {home.orders.some((row) => row.kind === "cita" && row.status !== "cancelled" && row.status !== "completed") ? home.orders.filter((row) => row.kind === "cita" && row.status !== "cancelled" && row.status !== "completed").map((row) => (
          <div key={row.id} className="account-row">
            <div>
              <strong>{row.title}</strong>
              <p>
                {new Date(row.at).toLocaleString(locale, { dateStyle: "medium", timeStyle: "short" })}
                {row.detail ? ` · ${row.detail}` : ""}
                {" · "}
                {STATUS[row.status] || row.status}
              </p>
            </div>
            <button type="button" className="booking-form__submit" onClick={() => void cancel(row)}>{t("cancel")}</button>
          </div>
        )) : <p className="booking-slots__empty">{t("manageEmpty")}</p>}
      </section>

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
