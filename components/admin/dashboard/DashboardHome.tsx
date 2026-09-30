"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/components/admin/clinic/client";
import { useClinicScope } from "@/components/admin/clinic/ClinicScope";

type Site = {
  id: string;
  name: string;
  city: string | null;
  appointments: number;
  patients: number;
  services: number;
  revenue: number;
};

type Upcoming = {
  id: string;
  starts_at: string;
  status: string;
  first_name: string | null;
  last_name: string | null;
  service_name: string | null;
  location_name: string | null;
};

type Stats = {
  appointments: number;
  revenue: string;
  new_patients: number;
  open_leads: number;
  patients: number;
  services: number;
  upcoming: Upcoming[];
  sites: Site[];
};

function money(value: number | string) {
  return `$${Number(value || 0).toFixed(0)}`;
}

export default function DashboardHome() {
  const scope = useClinicScope();
  const [data, setData] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<Stats>(`/api/admin/dashboard?${scope.query}`)
      .then(setData)
      .catch((err) => setError(err.message));
  }, [scope.query]);

  const place = scope.country === "MX" ? "México" : "Estados Unidos";

  return (
    <>
      <header className="admin-header admin-header--row">
        <div>
          <p className="admin-header__eyebrow">{place}</p>
          <h1 className="admin-header__title">Hoy en {scope.label}</h1>
        </div>
        <div className="admin-toolbar" data-tour="home-actions">
          <Link className="admin-btn admin-btn--primary" href="/admin/pacientes?nuevo=1">+ Paciente</Link>
          <Link className="admin-btn admin-btn--primary" href="/admin/leads?nuevo=1">+ Lead</Link>
          <Link className="admin-btn admin-btn--primary" href="/admin/calendario?nueva=1">+ Cita</Link>
          <Link className="admin-btn admin-btn--primary" href="/admin/cobrar">+ Cobro</Link>
        </div>
      </header>
      {error ? <div className="admin-alert">{error}</div> : null}
      <section className="admin-metrics" data-tour="home-metrics">
        <div className="admin-metric"><div className="admin-metric__value">{data?.appointments ?? "—"}</div><div className="admin-metric__label">Citas de hoy</div></div>
        <div className="admin-metric"><div className="admin-metric__value">{data ? money(data.revenue) : "—"}</div><div className="admin-metric__label">Ingresos de hoy</div></div>
        <div className="admin-metric"><div className="admin-metric__value">{data?.patients ?? "—"}</div><div className="admin-metric__label">Pacientes</div></div>
        <div className="admin-metric"><div className="admin-metric__value">{data?.services ?? "—"}</div><div className="admin-metric__label">Servicios en sede</div></div>
        <div className="admin-metric"><div className="admin-metric__value">{data?.new_patients ?? "—"}</div><div className="admin-metric__label">Pacientes nuevos hoy</div></div>
        <div className="admin-metric"><div className="admin-metric__value">{data?.open_leads ?? "—"}</div><div className="admin-metric__label">Leads abiertos</div></div>
      </section>
      <div className="admin-split">
        <div className="admin-table-wrap">
          <div className="admin-table__head"><div>Próximas citas</div></div>
          {(data?.upcoming || []).map((row) => (
            <div key={row.id} className="admin-table__row">
              <div>
                <div className="admin-table__cell-title">{row.first_name ? `${row.first_name} ${row.last_name}` : "Sin paciente"}</div>
                <div className="admin-table__cell-sub">{new Date(row.starts_at).toLocaleString("es-MX")} · {row.service_name || "Cita"} · {row.location_name || "Sede"} · {row.status}</div>
              </div>
            </div>
          ))}
          {!data?.upcoming?.length ? <div className="admin-table__empty">No hay citas próximas en las siguientes 24 horas.</div> : null}
        </div>
        <div className="admin-sites" aria-label="Sedes">
          {(data?.sites || []).map((site) => (
            <button
              key={site.id}
              type="button"
              className={`admin-site${scope.locationId === site.id ? " is-active" : ""}`}
              onClick={() => scope.setLocationId(scope.locationId === site.id ? "" : site.id)}
            >
              <span className="admin-site__name">{site.name}</span>
              <span className="admin-site__city">{site.city || place}</span>
              <span className="admin-site__stat">{site.appointments} citas hoy</span>
              <span className="admin-site__stat">{money(site.revenue)} hoy</span>
              <span className="admin-site__stat">{site.patients} pacientes</span>
              <span className="admin-site__stat">{site.services} servicios</span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
