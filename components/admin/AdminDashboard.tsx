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
import CmsPanel from "@/components/admin/CmsPanel";
import StorePanel from "@/components/admin/StorePanel";
import { PABAU_BOOKING_URL } from "@/lib/pabau";

type ContactRequestRow = {
  id: string;
  name: string;
  email: string;
  subject: string | null;
  message: string;
  read_at: string | null;
  created_at: string;
};

type AdminTab = "appointments" | "availability" | "cms" | "store" | "clients" | "contact";

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
    description:
      "La agenda vigente se gestiona en Pabau. Este sitio ya no guarda citas de pacientes.",
    icon: Calendar,
  },
  {
    id: "availability",
    label: "Disponibilidad",
    title: "Disponibilidad",
    description:
      "Deprecado: la disponibilidad se gestiona en Pabau. Este panel ya no afecta al sitio público.",
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
    description:
      "Los pacientes viven en Pabau. Aquí no hay cuentas de paciente en Postgres.",
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

function PabauOnlyNotice({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      className="rounded-xl border border-[rgb(var(--primary)/0.35)] bg-[rgb(var(--primary)/0.08)] px-4 py-4 text-sm"
      role="status"
    >
      <p className="font-medium text-[rgb(var(--text))]">{title}</p>
      <div className="mt-1 type-ui-muted space-y-2">{children}</div>
      <a
        href={PABAU_BOOKING_URL}
        target="_blank"
        rel="noreferrer"
        className="mt-3 inline-block font-medium text-[rgb(var(--primary))] underline underline-offset-2"
      >
        Abrir portal Pabau (partner-us)
      </a>
    </div>
  );
}

export default function AdminDashboard({ locale }: { locale: string }) {
  const [tab, setTab] = useState<AdminTab>("cms");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [contactRequests, setContactRequests] = useState<ContactRequestRow[]>([]);

  const unreadContacts = useMemo(
    () => contactRequests.filter((c) => !c.read_at).length,
    [contactRequests]
  );

  async function loadAll() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/contacts", { credentials: "same-origin" });
      const body = (await res.json().catch(() => ({}))) as {
        contacts?: ContactRequestRow[];
        error?: string;
      };
      if (!res.ok) {
        setError(body.error || "No se pudieron cargar las solicitudes");
        setContactRequests([]);
        return;
      }
      setContactRequests(body.contacts ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error de red");
      setContactRequests([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function markContactRequestRead(id: string) {
    try {
      const res = await fetch("/api/admin/contacts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ id }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        setError(body.error || "No se pudo marcar como leído");
        return;
      }
      setContactRequests((prev) =>
        prev.map((c) =>
          c.id === id ? { ...c, read_at: new Date().toISOString() } : c
        )
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error de red");
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
              {id === "contact" && unreadContacts > 0 ? (
                <span className="ml-auto text-xs font-semibold tabular-nums">
                  {unreadContacts}
                </span>
              ) : null}
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
          <section className="admin-metrics" aria-label="Métricas">
            <div className="admin-metric">
              <div className="admin-metric__value">{contactRequests.length}</div>
              <div className="admin-metric__label">Solicitudes</div>
            </div>
            <div className="admin-metric admin-metric--pending">
              <div className="admin-metric__value">{unreadContacts}</div>
              <div className="admin-metric__label">Sin leer</div>
            </div>
            <div className="admin-metric">
              <div className="admin-metric__value">Pabau</div>
              <div className="admin-metric__label">Citas / clientes</div>
            </div>
          </section>
        )}

        {loading ? (
          <div className="admin-skeleton" aria-busy="true" aria-label="Cargando" />
        ) : tab === "appointments" ? (
          <section className="admin-content__panel" aria-label="Citas">
            <PabauOnlyNotice title="Agenda en Pabau">
              <p>
                El sitio público no crea citas en Thrive. Pacientes reservan e inician
                sesión en el Booking Portal (partner-us). Usa el panel de Pabau para el
                historial clínico.
              </p>
            </PabauOnlyNotice>
          </section>
        ) : tab === "availability" ? (
          <div className="admin-content__panel">
            <PabauOnlyNotice title="Disponibilidad deprecada">
              <p>
                Los horarios públicos viven en Pabau → Online Booking. Este panel legacy
                de Supabase ya no se usa ni se edita desde aquí.
              </p>
            </PabauOnlyNotice>
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
            <PabauOnlyNotice title="Clientes en Pabau">
              <p>
                No hay perfiles de paciente en la base local. El registro y la ficha del
                cliente se crean/actualizan en Pabau al agendar o iniciar sesión en el
                portal.
              </p>
            </PabauOnlyNotice>
          </section>
        )}
      </main>
    </div>
  );
}
