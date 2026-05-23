"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase";
import BookingAvailabilityPanel from "@/components/admin/BookingAvailabilityPanel";
import CmsPanel from "@/components/admin/CmsPanel";

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

export default function AdminDashboard({ locale }: { locale: string }) {
  const [tab, setTab] = useState<
    "appointments" | "availability" | "cms" | "clients" | "contact"
  >("appointments");
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
              to: profile.email,
              date: appt.appointment_date,
              timeSlot: appt.time_slot,
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

  return (
    <main className="max-w-7xl mx-auto px-6 py-12">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
        <div>
          <h1 className="font-display text-3xl md:text-4xl tracking-wide">
            Admin
          </h1>
          <p className="text-muted mt-2">
            Gestiona citas y revisa los datos de clientes registrados.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setTab("appointments")}
            className={`rounded-xl px-4 py-2 text-sm font-medium border ${
              tab === "appointments"
                ? "bg-[rgb(var(--primary)/0.14)] border-[rgb(var(--primary)/0.35)]"
                : "bg-surface border-theme hover:bg-[rgb(var(--primary)/0.06)]"
            }`}
          >
            Citas
          </button>
          <button
            type="button"
            onClick={() => setTab("availability")}
            className={`rounded-xl px-4 py-2 text-sm font-medium border ${
              tab === "availability"
                ? "bg-[rgb(var(--primary)/0.14)] border-[rgb(var(--primary)/0.35)]"
                : "bg-surface border-theme hover:bg-[rgb(var(--primary)/0.06)]"
            }`}
          >
            Disponibilidad
          </button>
          <button
            type="button"
            onClick={() => setTab("cms")}
            className={`rounded-xl px-4 py-2 text-sm font-medium border ${
              tab === "cms"
                ? "bg-[rgb(var(--primary)/0.14)] border-[rgb(var(--primary)/0.35)]"
                : "bg-surface border-theme hover:bg-[rgb(var(--primary)/0.06)]"
            }`}
          >
            Contenido
          </button>
          <button
            type="button"
            onClick={() => setTab("clients")}
            className={`rounded-xl px-4 py-2 text-sm font-medium border ${
              tab === "clients"
                ? "bg-[rgb(var(--primary)/0.14)] border-[rgb(var(--primary)/0.35)]"
                : "bg-surface border-theme hover:bg-[rgb(var(--primary)/0.06)]"
            }`}
          >
            Clientes
          </button>
          <button
            type="button"
            onClick={() => setTab("contact")}
            className={`rounded-xl px-4 py-2 text-sm font-medium border ${
              tab === "contact"
                ? "bg-[rgb(var(--primary)/0.14)] border-[rgb(var(--primary)/0.35)]"
                : "bg-surface border-theme hover:bg-[rgb(var(--primary)/0.06)]"
            }`}
          >
            Solicitudes contacto
          </button>
          <button
            type="button"
            onClick={loadAll}
            className="rounded-xl px-4 py-2 text-sm font-medium border border-theme bg-surface hover:bg-[rgb(var(--primary)/0.06)]"
          >
            Refrescar
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 text-base">
          {error}
        </div>
      )}

      {!loading && (
        <section className="mt-8 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-7 gap-4" aria-label="Métricas">
          <div className="rounded-xl border border-theme bg-surface px-4 py-3">
            <div className="text-2xl font-semibold tabular-nums">{metrics.totalClients}</div>
            <div className="text-sm text-muted">Clientes</div>
          </div>
          <div className="rounded-xl border border-theme bg-surface px-4 py-3">
            <div className="text-2xl font-semibold tabular-nums">{metrics.totalAppointments}</div>
            <div className="text-sm text-muted">Citas totales</div>
          </div>
          <div className="rounded-xl border border-theme bg-surface px-4 py-3">
            <div className="text-2xl font-semibold tabular-nums">{metrics.appointmentsThisMonth}</div>
            <div className="text-sm text-muted">Citas este mes</div>
          </div>
          <div className="rounded-xl border border-theme bg-surface px-4 py-3">
            <div className="text-2xl font-semibold tabular-nums text-amber-600">{metrics.pending}</div>
            <div className="text-sm text-muted">Pendientes</div>
          </div>
          <div className="rounded-xl border border-theme bg-surface px-4 py-3">
            <div className="text-2xl font-semibold tabular-nums text-green-600">{metrics.confirmed}</div>
            <div className="text-sm text-muted">Confirmadas</div>
          </div>
          <div className="rounded-xl border border-theme bg-surface px-4 py-3">
            <div className="text-2xl font-semibold tabular-nums text-red-600">{metrics.cancelled}</div>
            <div className="text-sm text-muted">Canceladas</div>
          </div>
          <div className="rounded-xl border border-theme bg-surface px-4 py-3">
            <div className="text-2xl font-semibold tabular-nums">{metrics.newClientsLast7Days}</div>
            <div className="text-sm text-muted">Nuevos (7 días)</div>
          </div>
        </section>
      )}

      {!loading && metrics.referralBreakdown.length > 0 && (
        <section className="mt-6" aria-label="De dónde nos conocen">
          <h2 className="text-lg font-semibold text-muted mb-3">De dónde nos conocen</h2>
          <div className="rounded-xl border border-theme bg-surface p-4 flex flex-wrap gap-3">
            {metrics.referralBreakdown.map(({ source, count }) => (
              <div
                key={source}
                className="flex items-center gap-2 rounded-lg bg-[rgb(var(--bg)/0.5)] px-3 py-2 border border-theme"
              >
                <span className="font-medium tabular-nums">{count}</span>
                <span className="text-muted text-sm">
                  {REFERRAL_SOURCE_LABELS[source] ?? (source === "no_indicated" ? "No indicado" : source)}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {loading ? (
        <div className="mt-10 animate-pulse h-64 bg-surface rounded-2xl border border-theme" />
      ) : tab === "appointments" ? (
        <section className="mt-10">
          <div className="rounded-2xl border border-theme bg-surface overflow-hidden">
            <div className="grid grid-cols-[1.2fr_1fr_0.8fr_0.9fr_1.2fr] gap-4 px-6 py-4 text-sm text-muted border-b border-theme">
              <div>Cliente</div>
              <div>Fecha / hora</div>
              <div>Tipo</div>
              <div>Estado</div>
              <div>Acciones</div>
            </div>
            <div className="divide-y divide-[rgb(var(--border)/0.18)]">
              {appointments.map((a) => {
                const p = profileById.get(a.user_id);
                return (
                  <div
                    key={a.id}
                    className="grid grid-cols-[1.2fr_1fr_0.8fr_0.9fr_1.2fr] gap-4 px-6 py-4"
                  >
                    <div className="min-w-0">
                      <div className="font-medium truncate">
                        {p?.full_name?.trim() || p?.email || "Cliente (sin nombre)"}
                      </div>
                      <div className="text-sm text-muted truncate">
                        {p?.phone?.trim() || "No indicado"}
                      </div>
                    </div>
                    <div>
                      <div className="font-medium">
                        {a.appointment_date} {a.time_slot}
                      </div>
                      <div className="text-sm text-muted">
                        {new Date(a.created_at).toLocaleString(locale)}
                      </div>
                    </div>
                    <div className="capitalize">{a.type}</div>
                    <div className="capitalize">{a.status}</div>
                    <div className="flex flex-col gap-2">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => updateAppointmentStatus(a.id, "confirmed")}
                          className="rounded-lg px-3 py-1.5 text-xs font-medium border border-theme bg-[rgb(var(--primary)/0.10)] hover:bg-[rgb(var(--primary)/0.16)]"
                        >
                          Confirmar
                        </button>
                        <button
                          type="button"
                          onClick={() => updateAppointmentStatus(a.id, "pending")}
                          className="rounded-lg px-3 py-1.5 text-xs font-medium border border-theme bg-surface hover:bg-[rgb(var(--primary)/0.06)]"
                        >
                          Pendiente
                        </button>
                        <button
                          type="button"
                          onClick={() => updateAppointmentStatus(a.id, "cancelled")}
                          className="rounded-lg px-3 py-1.5 text-xs font-medium border border-red-500/40 text-red-600 hover:bg-red-500/10"
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
                        className="w-full rounded-xl border border-theme bg-[rgb(var(--bg)/0.35)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary))]"
                        rows={2}
                      />
                    </div>
                  </div>
                );
              })}

              {!appointments.length && (
                <div className="px-6 py-10 text-muted">No hay citas.</div>
              )}
            </div>
          </div>
        </section>
      ) : tab === "availability" ? (
        <BookingAvailabilityPanel />
      ) : tab === "cms" ? (
        <CmsPanel />
      ) : tab === "contact" ? (
        <section className="mt-10">
          <div className="rounded-2xl border border-theme bg-surface overflow-hidden">
            <div className="grid grid-cols-[1fr_1.2fr_1.5fr_0.6fr] gap-4 px-6 py-4 text-sm text-muted border-b border-theme">
              <div>Nombre / Email</div>
              <div>Asunto</div>
              <div>Mensaje</div>
              <div>Estado</div>
            </div>
            <div className="divide-y divide-[rgb(var(--border)/0.18)]">
              {contactRequests.map((c) => (
                <div
                  key={c.id}
                  className={`grid grid-cols-[1fr_1.2fr_1.5fr_0.6fr] gap-4 px-6 py-4 ${!c.read_at ? "bg-[rgb(var(--primary)/0.06)]" : ""}`}
                >
                  <div className="min-w-0">
                    <div className="font-medium truncate">{c.name}</div>
                    <div className="text-sm text-muted truncate">{c.email}</div>
                    <div className="text-xs text-muted mt-1">
                      {new Date(c.created_at).toLocaleString(locale)}
                    </div>
                  </div>
                  <div className="text-sm truncate">{c.subject || "—"}</div>
                  <div className="text-sm text-muted whitespace-pre-wrap break-words">{c.message}</div>
                  <div className="flex flex-col gap-2">
                    {!c.read_at ? (
                      <button
                        type="button"
                        onClick={() => markContactRequestRead(c.id)}
                        className="rounded-lg px-3 py-1.5 text-xs font-medium border border-theme bg-[rgb(var(--primary)/0.10)] hover:bg-[rgb(var(--primary)/0.16)]"
                      >
                        Marcar leído
                      </button>
                    ) : (
                      <span className="text-xs text-muted">Leído</span>
                    )}
                  </div>
                </div>
              ))}
              {!contactRequests.length && (
                <div className="px-6 py-10 text-muted">No hay solicitudes de contacto.</div>
              )}
            </div>
          </div>
        </section>
      ) : (
        <section className="mt-10">
          <div className="rounded-2xl border border-theme bg-surface overflow-hidden">
            <div className="grid grid-cols-[1.2fr_1fr_1fr_1fr] gap-4 px-6 py-4 text-sm text-muted border-b border-theme">
              <div>Cliente</div>
              <div>Contacto</div>
              <div>Datos</div>
              <div>Origen</div>
            </div>
            <div className="divide-y divide-[rgb(var(--border)/0.18)]">
              {profiles.map((p) => (
                <div
                  key={p.id}
                  className="grid grid-cols-[1.2fr_1fr_1fr_1fr] gap-4 px-6 py-4"
                >
                  <div className="min-w-0">
                    <div className="font-medium truncate">
                      {p.full_name?.trim() || p.email || "Sin nombre"}
                    </div>
                    <div className="text-sm text-muted truncate">
                      {p.full_name?.trim() && p.email ? `${p.email} · ` : ""}Rol: {p.role}
                    </div>
                  </div>
                  <div className="text-sm">
                    <div>{p.phone?.trim() || "No indicado"}</div>
                    <div className="text-muted">
                      Pref: {p.contact_preference ? (CONTACT_PREFERENCE_LABELS[p.contact_preference] ?? p.contact_preference) : "No indicado"}
                    </div>
                  </div>
                  <div className="text-sm">
                    <div>Nac: {p.birth_date || "No indicado"}</div>
                    <div className="text-muted">
                      Edad: {p.age != null ? p.age : "No indicado"} · Sexo: {p.sex ? (SEX_LABELS[p.sex] ?? p.sex) : "No indicado"}
                    </div>
                    <div className="text-muted truncate">
                      Dir: {p.address?.trim() || "No indicado"}
                    </div>
                  </div>
                  <div className="text-sm">
                    <div>
                      {p.referral_source
                        ? (REFERRAL_SOURCE_LABELS[p.referral_source] ?? p.referral_source)
                        : "No indicado"}
                    </div>
                    {p.referral_source === "other" && (
                      <div className="text-muted truncate">
                        {p.referral_source_other?.trim() || "No indicado"}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {!profiles.length && (
                <div className="px-6 py-10 text-muted">
                  No hay clientes cargados.
                </div>
              )}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}

