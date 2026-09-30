"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/components/admin/clinic/client";

type Stats = {
  appointments: number;
  revenue: string;
  new_patients: number;
  open_leads: number;
  upcoming: { id: string; starts_at: string; status: string; first_name: string | null; last_name: string | null; service_name: string | null }[];
};

export default function DashboardHome() {
  const [data, setData] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    api<Stats>("/api/admin/dashboard").then(setData).catch((e) => setError(e.message));
  }, []);
  return (
    <>
      <header className="admin-header">
        <p className="admin-header__eyebrow">Panel de administración</p>
        <h1 className="admin-header__title">Hoy en la clínica</h1>
        <p className="admin-header__desc">Citas del día, ingresos, pacientes nuevos y leads abiertos.</p>
      </header>
      {error ? <div className="admin-alert">{error}</div> : null}
      <section className="admin-metrics" data-tour="home-metrics">
        <div className="admin-metric"><div className="admin-metric__value">{data?.appointments ?? "—"}</div><div className="admin-metric__label">Citas de hoy</div></div>
        <div className="admin-metric"><div className="admin-metric__value">{data ? `$${Number(data.revenue).toFixed(0)}` : "—"}</div><div className="admin-metric__label">Ingresos de hoy</div></div>
        <div className="admin-metric"><div className="admin-metric__value">{data?.new_patients ?? "—"}</div><div className="admin-metric__label">Pacientes nuevos</div></div>
        <div className="admin-metric"><div className="admin-metric__value">{data?.open_leads ?? "—"}</div><div className="admin-metric__label">Leads abiertos</div></div>
      </section>
      <div className="admin-toolbar" data-tour="home-actions">
        <Link className="admin-btn admin-btn--primary" href="/admin/pacientes?nuevo=1">+ Paciente</Link>
        <Link className="admin-btn admin-btn--primary" href="/admin/leads?nuevo=1">+ Lead</Link>
        <Link className="admin-btn admin-btn--primary" href="/admin/calendario?nueva=1">+ Cita</Link>
        <Link className="admin-btn admin-btn--primary" href="/admin/cobrar">+ Cobro</Link>
      </div>
      <div className="admin-table-wrap">
        <div className="admin-table__head"><div>Próximas citas</div></div>
        {(data?.upcoming || []).map((row) => (
          <div key={row.id} className="admin-table__row">
            <div>
              <div className="admin-table__cell-title">{row.first_name ? `${row.first_name} ${row.last_name}` : "Sin paciente"}</div>
              <div className="admin-table__cell-sub">{new Date(row.starts_at).toLocaleString("es-MX")} · {row.service_name || "Cita"} · {row.status}</div>
            </div>
          </div>
        ))}
        {!data?.upcoming?.length ? <div className="admin-table__empty">No hay citas próximas en las siguientes 24 horas.</div> : null}
      </div>
    </>
  );
}
