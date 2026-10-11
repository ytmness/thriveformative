"use client";

import { useEffect, useState } from "react";
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

  const english = scope.country === "US";
  const place = english ? "United States" : "México";

  return (
    <>
      <header className="admin-header">
        <div>
          <p className="admin-header__eyebrow">{place}</p>
          <h1 className="admin-header__title">{english ? `Today in ${scope.label}` : `Hoy en ${scope.label}`}</h1>
        </div>
      </header>
      {error ? <div className="admin-alert">{error}</div> : null}
      <section className="admin-metrics" data-tour="home-metrics">
        <div className="admin-metric"><div className="admin-metric__value">{data?.appointments ?? "—"}</div><div className="admin-metric__label">{english ? "Appointments today" : "Citas de hoy"}</div></div>
        <div className="admin-metric"><div className="admin-metric__value">{data ? money(data.revenue) : "—"}</div><div className="admin-metric__label">{english ? "Revenue today" : "Ingresos de hoy"}</div></div>
        <div className="admin-metric"><div className="admin-metric__value">{data?.patients ?? "—"}</div><div className="admin-metric__label">{english ? "Patients" : "Pacientes"}</div></div>
        <div className="admin-metric"><div className="admin-metric__value">{data?.services ?? "—"}</div><div className="admin-metric__label">{english ? "Services at this location" : "Servicios en sede"}</div></div>
        <div className="admin-metric"><div className="admin-metric__value">{data?.new_patients ?? "—"}</div><div className="admin-metric__label">{english ? "New patients today" : "Pacientes nuevos hoy"}</div></div>
        <div className="admin-metric"><div className="admin-metric__value">{data?.open_leads ?? "—"}</div><div className="admin-metric__label">{english ? "Open leads" : "Leads abiertos"}</div></div>
      </section>
      <div className="admin-split">
        <div className="admin-table-wrap">
          <div className="admin-table__head"><div>{english ? "Upcoming appointments" : "Próximas citas"}</div></div>
          {(data?.upcoming || []).map((row) => (
            <div key={row.id} className="admin-table__row">
              <div>
                <div className="admin-table__cell-title">{row.first_name ? `${row.first_name} ${row.last_name}` : (english ? "No patient" : "Sin paciente")}</div>
                <div className="admin-table__cell-sub">{new Date(row.starts_at).toLocaleString(english ? "en-US" : "es-MX")} · {row.service_name || (english ? "Appointment" : "Cita")} · {row.location_name || (english ? "Location" : "Sede")} · {row.status}</div>
              </div>
            </div>
          ))}
          {!data?.upcoming?.length ? <div className="admin-table__empty">{english ? "No appointments in the next 24 hours." : "No hay citas próximas en las siguientes 24 horas."}</div> : null}
        </div>
        <div className="admin-sites" aria-label={english ? "Locations" : "Sedes"}>
          {(data?.sites || []).map((site) => (
            <button
              key={site.id}
              type="button"
              className={`admin-site${scope.locationId === site.id ? " is-active" : ""}`}
              onClick={() => scope.setLocationId(scope.locationId === site.id ? "" : site.id)}
            >
              <span className="admin-site__name">{site.name}</span>
              <span className="admin-site__city">{site.city || place}</span>
              <span className="admin-site__stat">{site.appointments} {english ? "appointments today" : "citas hoy"}</span>
              <span className="admin-site__stat">{money(site.revenue)} {english ? "today" : "hoy"}</span>
              <span className="admin-site__stat">{site.patients} {english ? "patients" : "pacientes"}</span>
              <span className="admin-site__stat">{site.services} {english ? "services" : "servicios"}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
