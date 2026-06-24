"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Calendar,
  Clock,
  FileText,
  Mail,
  RefreshCw,
  ShoppingBag,
  Users,
  type LucideIcon,
} from "lucide-react";
import { createClient } from "@/lib/supabase";
import BookingAvailabilityPanel from "@/components/admin/BookingAvailabilityPanel";
import CmsPanel from "@/components/admin/CmsPanel";
import StorePanel from "@/components/admin/StorePanel";

type AppointmentRow = {
  id: string;
  user_id: string;
  appointment_date: string;
  time_slot: string;
  type: string;
  status: string;
  notes: string | null;
  created_at: string;
};

type ProfileRow = {
  id: string;
  role: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  birth_date: string | null;
  age: number | null;
  contact_preference: string | null;
  address: string | null;
  sex: string | null;
  referral_source: string | null;
  referral_source_other: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type ContactRequestRow = {
  id: string;
  name: string;
  email: string;
  subject: string | null;
  message: string;
  read_at: string | null;
  created_at: string;
};

const CONTACT_PREFERENCE_LABELS: Record<string, string> = {
  email: "Email",
  call: "Llamada",
  whatsapp: "WhatsApp",
};

const REFERRAL_SOURCE_LABELS: Record<string, string> = {
  website: "Web",
  doctor: "Médico",
  friend_family: "Amigo/familia",
  social_media: "Redes sociales",
  ads_meta_tiktok: "Anuncios Meta/TikTok",
  ads_google: "Anuncios Google",
  other: "Otro",
};

const SEX_LABELS: Record<string, string> = {
  female: "Femenino",
  male: "Masculino",
  other: "Otro",
};

type AdminTab =
  | "appointments"
  | "availability"
  | "cms"
  | "store"
  | "clients"
  | "contact";

const NAV_ITEMS: {
  id: AdminTab;
  label: string;
  title: string;
  description: string;
  icon: LucideIcon;
}[] = [
  {
    id: "appointments",
    label: "Citas",
    title: "Citas",
    description: "Gestiona solicitudes, confirma o cancela citas y añade notas internas.",
    icon: Calendar,
  },
  {
    id: "availability",
    label: "Disponibilidad",
    title: "Disponibilidad",
    description: "Configura horarios semanales, bloqueos y ajustes del calendario de citas.",
    icon: Clock,
  },
  {
    id: "cms",
    label: "Contenido",
    title: "Contenido del sitio",
    description: "Edita textos, servicios, planes y secciones del sitio web.",
    icon: FileText,
  },
  {
    id: "store",
    label: "Tienda",
    title: "Tienda",
    description: "Administra categorías y productos con enlace de referido externo.",
    icon: ShoppingBag,
  },
  {
    id: "clients",
    label: "Clientes",
    title: "Clientes",
    description: "Revisa perfiles registrados, datos de contacto y origen de referencia.",
    icon: Users,
  },
  {
    id: "contact",
    label: "Solicitudes",
    title: "Solicitudes de contacto",
    description: "Mensajes recibidos desde el formulario de contacto del sitio.",
    icon: Mail,
  },
];

function statusBadgeClass(status: string): string {
  if (status === "pending") return "admin-badge admin-badge--pending";
  if (status === "confirmed") return "admin-badge admin-badge--confirmed";
  if (status === "cancelled") return "admin-badge admin-badge--cancelled";
  return "admin-badge";
}

export default function AdminDashboard({ locale }: { locale: string }) {
  const [tab, setTab] = useState<AdminTab>("appointments");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [appointments, setAppointments] = useState<AppointmentRow[]>([]);
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [contactRequests, setContactRequests] = useState<ContactRequestRow[]>([]);

  const profileById = useMemo(() => {
    const map = new Map<string, ProfileRow>();
    profiles.forEach((p) => map.set(p.id, p));
    return map;
  }, [profiles]);

  const metrics = useMemo(() => {
    const clients = profiles.filter((p) => p.role === "client");
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const newClientsLast7Days = clients.filter((p) => {
      const created = p.created_at ? new Date(p.created_at) : null;
      return created && created >= sevenDaysAgo;
    }).length;
    const appointmentsThisMonth = appointments.filter((a) => {
      const d = new Date(a.appointment_date);
      return d >= startOfMonth;
    }).length;
    const pending = appointments.filter((a) => a.status === "pending").length;
    const confirmed = appointments.filter((a) => a.status === "confirmed").length;
    const cancelled = appointments.filter((a) => a.status === "cancelled").length;
    const byReferral: Record<string, number> = {};
    clients.forEach((p) => {
      const key = p.referral_source?.trim() || "no_indicated";
      byReferral[key] = (byReferral[key] ?? 0) + 1;
    });
    const referralBreakdown = Object.entries(byReferral)
      .map(([key, count]) => ({ source: key, count }))
      .sort((a, b) => b.count - a.count);
    return {
      totalClients: clients.length,
      totalAppointments: appointments.length,
      appointmentsThisMonth,
      pending,
      confirmed,
      cancelled,
      newClientsLast7Days,
      referralBreakdown,
    };
  }, [profiles, appointments]);

  async function loadAll() {
    setLoading(true);
    setError(null);
    const supabase = createClient();

    const { data: appts, error: apptErr } = await supabase
      .from("appointments")
      .select(
        "id,user_id,appointment_date,time_slot,type,status,notes,created_at"
      )
      .order("appointment_date", { ascending: false })
      .order("time_slot", { ascending: false });

    if (apptErr) {
      setError(apptErr.message);
      setLoading(false);
      return;
    }

    const { data: profs, error: profErr } = await supabase
      .from("profiles")
      .select(
        "id,role,full_name,email,phone,birth_date,age,contact_preference,address,sex,referral_source,referral_source_other,created_at,updated_at"
      )
      .order("created_at", { ascending: false });

    if (profErr) {
      setError(profErr.message);
      setLoading(false);
      return;
    }

    const { data: contacts } = await supabase
      .from("contact_requests")
      .select("id,name,email,subject,message,read_at,created_at")
      .order("created_at", { ascending: false });

    setAppointments((appts ?? []) as AppointmentRow[]);
    setProfiles((profs ?? []) as ProfileRow[]);
    setContactRequests((contacts ?? []) as ContactRequestRow[]);
    setLoading(false);
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function updateAppointmentStatus(id: string, status: string) {
    const supabase = createClient();
    const { error: upErr } = await supabase
      .from("appointments")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (upErr) {
      setError(upErr.message);
      return;
    }
    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status } : a))
    );

    if (status === "confirmed" || status === "cancelled") {
      const appt = appointments.find((a) => a.id === id);
      const profile = appt ? profileById.get(appt.user_id) : null;
      if (appt?.user_id && profile) {
        const isConfirmed = status === "confirmed";
        const title = isConfirmed
          ? "Cita confirmada"
          : "Cita cancelada";
        const body = isConfirmed
          ? `Tu cita del ${appt.appointment_date} a las ${appt.time_slot} ha sido confirmada.`
          : `Tu cita del ${appt.appointment_date} a las ${appt.time_slot} ha sido cancelada.`;
        await supabase.from("notifications").insert({
          user_id: appt.user_id,
          type: isConfirmed ? "appointment_confirmed" : "appointment_cancelled",
          title,
          body,
          reference_id: appt.id,
        });
        if (profile.email) {
          await fetch("/api/send-email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              kind: isConfirmed ? "appointment_confirmed" : "appointment_cancelled",
              appointmentId: appt.id,
              date: appt.appointment_date,
              timeSlot: appt.time_slot,
              website: "",
            }),
          });
        }
      }
    }
  }

  async function updateAppointmentNotes(id: string, notes: string) {
    const supabase = createClient();
    const { error: upErr } = await supabase
      .from("appointments")
      .update({ notes, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (upErr) {
      setError(upErr.message);
      return;
    }
    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, notes } : a))
    );
  }

  async function markContactRequestRead(id: string) {
    const supabase = createClient();
    const { error: upErr } = await supabase
      .from("contact_requests")
      .update({ read_at: new Date().toISOString() })
      .eq("id", id);
    if (!upErr) {
      setContactRequests((prev) =>
        prev.map((c) => (c.id === id ? { ...c, read_at: new Date().toISOString() } : c))
      );
    }
  }

  const activeMeta = NAV_ITEMS.find((n) => n.id === tab) ?? NAV_ITEMS[0];

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar" aria-label="Navegación del panel">
        <div className="admin-sidebar__brand">
          <p className="admin-sidebar__eyebrow">Thrive Formative</p>
          <p className="admin-sidebar__title">Admin</p>
        </div>

        <nav className="admin-nav" role="tablist" aria-label="Secciones del panel">
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              aria-current={tab === id ? "page" : undefined}
              className={`admin-nav__item${tab === id ? " admin-nav__item--active" : ""}`}
              onClick={() => setTab(id)}
            >
              <Icon className="admin-nav__icon" size={17} strokeWidth={2} aria-hidden />
              {label}
            </button>
          ))}
        </nav>

        <div className="admin-sidebar__footer">
          <button
            type="button"
            className="admin-nav__refresh"
            onClick={loadAll}
            aria-label="Refrescar datos"
          >
            <RefreshCw size={15} strokeWidth={2.25} aria-hidden />
            Refrescar
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <header className="admin-header">
          <p className="admin-header__eyebrow">Panel de administración</p>
          <h1 className="admin-header__title">{activeMeta.title}</h1>
          <p className="admin-header__desc">{activeMeta.description}</p>
          <div className="admin-header__actions">
            <button type="button" className="admin-nav__refresh" onClick={loadAll}>
              <RefreshCw size={15} strokeWidth={2.25} aria-hidden />
              Refrescar
            </button>
          </div>
        </header>

        {error ? <div className="admin-alert" role="alert">{error}</div> : null}

        {!loading && (
          <>
            <section className="admin-metrics" aria-label="Métricas">
              <div className="admin-metric">
                <div className="admin-metric__value">{metrics.totalClients}</div>
                <div className="admin-metric__label">Clientes</div>
              </div>
              <div className="admin-metric">
                <div className="admin-metric__value">{metrics.totalAppointments}</div>
                <div className="admin-metric__label">Citas totales</div>
              </div>
              <div className="admin-metric">
                <div className="admin-metric__value">{metrics.appointmentsThisMonth}</div>
                <div className="admin-metric__label">Citas este mes</div>
              </div>
              <div className="admin-metric admin-metric--pending">
                <div className="admin-metric__value">{metrics.pending}</div>
                <div className="admin-metric__label">Pendientes</div>
              </div>
              <div className="admin-metric admin-metric--confirmed">
                <div className="admin-metric__value">{metrics.confirmed}</div>
                <div className="admin-metric__label">Confirmadas</div>
              </div>
              <div className="admin-metric admin-metric--cancelled">
                <div className="admin-metric__value">{metrics.cancelled}</div>
                <div className="admin-metric__label">Canceladas</div>
              </div>
              <div className="admin-metric">
                <div className="admin-metric__value">{metrics.newClientsLast7Days}</div>
                <div className="admin-metric__label">Nuevos (7 días)</div>
              </div>
            </section>

            {metrics.referralBreakdown.length > 0 ? (
              <section className="admin-referral" aria-label="De dónde nos conocen">
                <h2 className="admin-referral__title">De dónde nos conocen</h2>
                <div className="admin-referral__card">
                  {metrics.referralBreakdown.map(({ source, count }) => (
                    <span key={source} className="admin-referral__chip">
                      <span className="admin-referral__chip-count">{count}</span>
                      <span className="admin-referral__chip-label">
                        {REFERRAL_SOURCE_LABELS[source] ??
                          (source === "no_indicated" ? "No indicado" : source)}
                      </span>
                    </span>
                  ))}
                </div>
              </section>
            ) : null}
          </>
        )}

        {loading ? (
          <div className="admin-skeleton" aria-busy="true" aria-label="Cargando" />
        ) : tab === "appointments" ? (
          <section className="admin-content__panel" aria-label="Citas">
            <div className="admin-table-wrap">
              <div className="admin-table">
                <div className="admin-table__head admin-table__head--appointments">
                  <div>Cliente</div>
                  <div>Fecha / hora</div>
                  <div>Tipo</div>
                  <div>Estado</div>
                  <div>Acciones</div>
                </div>
                <div className="admin-table__body">
                  {appointments.map((a) => {
                    const p = profileById.get(a.user_id);
                    return (
                      <div
                        key={a.id}
                        className="admin-table__row admin-table__row--appointments"
                      >
                        <div className="min-w-0">
                          <div className="admin-table__cell-title truncate">
                            {p?.full_name?.trim() || p?.email || "Cliente (sin nombre)"}
                          </div>
                          <div className="admin-table__cell-sub truncate">
                            {p?.phone?.trim() || "No indicado"}
                          </div>
                        </div>
                        <div>
                          <div className="admin-table__cell-title">
                            {a.appointment_date} {a.time_slot}
                          </div>
                          <div className="admin-table__cell-sub">
                            {new Date(a.created_at).toLocaleString(locale)}
                          </div>
                        </div>
                        <div className="capitalize text-sm">{a.type}</div>
                        <div>
                          <span className={statusBadgeClass(a.status)}>{a.status}</span>
                        </div>
                        <div>
                          <div className="admin-table__actions">
                            <button
                              type="button"
                              onClick={() => updateAppointmentStatus(a.id, "confirmed")}
                              className="admin-btn admin-btn--primary"
                            >
                              Confirmar
                            </button>
                            <button
                              type="button"
                              onClick={() => updateAppointmentStatus(a.id, "pending")}
                              className="admin-btn admin-btn--ghost"
                            >
                              Pendiente
                            </button>
                            <button
                              type="button"
                              onClick={() => updateAppointmentStatus(a.id, "cancelled")}
                              className="admin-btn admin-btn--danger"
                            >
                              Cancelar
                            </button>
                          </div>
                          <textarea
                            value={a.notes ?? ""}
                            onChange={(e) =>
                              setAppointments((prev) =>
                                prev.map((x) =>
                                  x.id === a.id ? { ...x, notes: e.target.value } : x
                                )
                              )
                            }
                            onBlur={(e) => updateAppointmentNotes(a.id, e.target.value)}
                            placeholder="Notas…"
                            className="admin-table__notes"
                            rows={2}
                          />
                        </div>
                      </div>
                    );
                  })}
                  {!appointments.length ? (
                    <div className="admin-table__empty">No hay citas.</div>
                  ) : null}
                </div>
              </div>
            </div>
          </section>
        ) : tab === "availability" ? (
          <div className="admin-content__panel">
            <BookingAvailabilityPanel />
          </div>
        ) : tab === "cms" ? (
          <div className="admin-content__panel">
            <CmsPanel siteLocale={locale} />
          </div>
        ) : tab === "store" ? (
          <div className="admin-content__panel">
            <StorePanel siteLocale={locale} />
          </div>
        ) : tab === "contact" ? (
          <section className="admin-content__panel" aria-label="Solicitudes de contacto">
            <div className="admin-table-wrap">
              <div className="admin-table">
                <div className="admin-table__head admin-table__head--contact">
                  <div>Nombre / Email</div>
                  <div>Asunto</div>
                  <div>Mensaje</div>
                  <div>Estado</div>
                </div>
                <div className="admin-table__body">
                  {contactRequests.map((c) => (
                    <div
                      key={c.id}
                      className={`admin-table__row admin-table__row--contact${!c.read_at ? " admin-table__row--unread" : ""}`}
                    >
                      <div className="min-w-0">
                        <div className="admin-table__cell-title truncate">{c.name}</div>
                        <div className="admin-table__cell-sub truncate">{c.email}</div>
                        <div className="admin-table__cell-sub">
                          {new Date(c.created_at).toLocaleString(locale)}
                        </div>
                      </div>
                      <div className="text-sm truncate">{c.subject || "—"}</div>
                      <div className="text-sm text-muted whitespace-pre-wrap break-words">
                        {c.message}
                      </div>
                      <div>
                        {!c.read_at ? (
                          <button
                            type="button"
                            onClick={() => markContactRequestRead(c.id)}
                            className="admin-btn admin-btn--primary"
                          >
                            Marcar leído
                          </button>
                        ) : (
                          <span className="admin-badge admin-badge--read">Leído</span>
                        )}
                      </div>
                    </div>
                  ))}
                  {!contactRequests.length ? (
                    <div className="admin-table__empty">No hay solicitudes de contacto.</div>
                  ) : null}
                </div>
              </div>
            </div>
          </section>
        ) : (
          <section className="admin-content__panel" aria-label="Clientes">
            <div className="admin-table-wrap">
              <div className="admin-table">
                <div className="admin-table__head admin-table__head--clients">
                  <div>Cliente</div>
                  <div>Contacto</div>
                  <div>Datos</div>
                  <div>Origen</div>
                </div>
                <div className="admin-table__body">
                  {profiles.map((p) => (
                    <div key={p.id} className="admin-table__row admin-table__row--clients">
                      <div className="min-w-0">
                        <div className="admin-table__cell-title truncate">
                          {p.full_name?.trim() || p.email || "Sin nombre"}
                        </div>
                        <div className="admin-table__cell-sub truncate">
                          {p.full_name?.trim() && p.email ? `${p.email} · ` : ""}Rol: {p.role}
                        </div>
                      </div>
                      <div className="text-sm">
                        <div>{p.phone?.trim() || "No indicado"}</div>
                        <div className="admin-table__cell-sub">
                          Pref:{" "}
                          {p.contact_preference
                            ? (CONTACT_PREFERENCE_LABELS[p.contact_preference] ??
                              p.contact_preference)
                            : "No indicado"}
                        </div>
                      </div>
                      <div className="text-sm">
                        <div>Nac: {p.birth_date || "No indicado"}</div>
                        <div className="admin-table__cell-sub">
                          Edad: {p.age != null ? p.age : "No indicado"} · Sexo:{" "}
                          {p.sex ? (SEX_LABELS[p.sex] ?? p.sex) : "No indicado"}
                        </div>
                        <div className="admin-table__cell-sub truncate">
                          Dir: {p.address?.trim() || "No indicado"}
                        </div>
                      </div>
                      <div className="text-sm">
                        <div>
                          {p.referral_source
                            ? (REFERRAL_SOURCE_LABELS[p.referral_source] ?? p.referral_source)
                            : "No indicado"}
                        </div>
                        {p.referral_source === "other" ? (
                          <div className="admin-table__cell-sub truncate">
                            {p.referral_source_other?.trim() || "No indicado"}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  ))}
                  {!profiles.length ? (
                    <div className="admin-table__empty">No hay clientes cargados.</div>
                  ) : null}
                </div>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

