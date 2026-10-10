"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Calendar,
  ClipboardList,
  Clock,
  CreditCard,
  FileText,
  LayoutDashboard,
  MessageSquare,
  Package,
  Settings,
  ShoppingBag,
  Receipt,
  UserCog,
  Users,
  Wallet,
  BarChart3,
  Contact,
} from "lucide-react";
import NotificationBell from "@/components/NotificationBell";
import ThemeProvider from "@/components/theme/ThemeProvider";
import ThemeSwitcher from "@/components/theme/ThemeSwitcher";
import { api } from "@/components/admin/clinic/client";
import { ClinicScopeProvider, ScopeBar } from "@/components/admin/clinic/ClinicScope";
import { AssistantDock } from "@/components/admin/assistant/AssistantDock";
import { TutorialButton } from "@/components/admin/tutorial";

type NavItem = {
  group: string;
  href: string;
  label: string;
  perms: string[];
  icon: typeof LayoutDashboard;
  exact?: boolean;
  match?: string;
  exclude?: string[];
};

const NAV: NavItem[] = [
  { group: "Día a día", href: "/admin", label: "Dashboard", perms: ["dashboard.read"], icon: LayoutDashboard, exact: true },
  { group: "Día a día", href: "/admin/calendario", label: "Calendario", perms: ["appointments.read"], icon: Calendar },
  { group: "Día a día", href: "/admin/pacientes", label: "Pacientes", perms: ["patients.read"], icon: Users },
  { group: "Día a día", href: "/admin/leads", label: "Leads", perms: ["leads.read"], icon: Contact },
  { group: "Dinero", href: "/admin/cobrar", label: "Cobrar", perms: ["sales.read"], icon: CreditCard },
  { group: "Dinero", href: "/admin/ventas", label: "Ventas", perms: ["sales.read"], icon: ShoppingBag },
  { group: "Dinero", href: "/admin/tienda/pedidos", label: "Pedidos en línea", perms: ["sales.read"], icon: Receipt },
  { group: "Dinero", href: "/admin/facturas", label: "Facturas", perms: ["invoices.read"], icon: Wallet },
  { group: "Catálogo", href: "/admin/catalogo/servicios", label: "Servicios y productos", perms: ["inventory.read", "settings.read"], icon: Package, match: "/admin/catalogo" },
  { group: "Sitio web", href: "/admin/contenido", label: "Contenido", perms: ["settings.write"], icon: FileText },
  { group: "Clínica", href: "/admin/formularios", label: "Formularios", perms: ["forms.read"], icon: ClipboardList },
  { group: "Clínica", href: "/admin/comunicaciones", label: "Comunicaciones", perms: ["communications.read"], icon: MessageSquare },
  { group: "Clínica", href: "/admin/reportes", label: "Reportes", perms: ["reports.read"], icon: BarChart3, match: "/admin/reportes" },
  { group: "Clínica", href: "/admin/configuracion/horarios", label: "Horarios", perms: ["settings.read"], icon: Clock, match: "/admin/configuracion/horarios" },
  { group: "Clínica", href: "/admin/configuracion/equipo", label: "Equipo y roles", perms: ["settings.read"], icon: UserCog, match: "/admin/configuracion/equipo" },
  { group: "Clínica", href: "/admin/configuracion/sedes", label: "Configuración", perms: ["settings.read"], icon: Settings, match: "/admin/configuracion", exclude: ["/admin/configuracion/horarios", "/admin/configuracion/equipo"] },
];

export default function AdminShell({
  staffName,
  permissions,
  children,
}: {
  staffName: string;
  permissions: string[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const items = NAV.filter((item) => item.perms.some((perm) => permissions.includes(perm)));
  const groups: { label: string; items: NavItem[] }[] = [];
  for (const item of items) {
    const last = groups[groups.length - 1];
    if (!last || last.label !== item.group) groups.push({ label: item.group, items: [item] });
    else last.items.push(item);
  }

  async function logout() {
    await api("/api/admin/logout", { method: "POST" });
    router.replace("/admin/login");
    router.refresh();
  }

  return (
    <ThemeProvider>
      <ClinicScopeProvider>
      <div className="admin-shell">
        <aside className="admin-sidebar" aria-label="Navegación del panel">
          <div className="admin-sidebar__brand">
            <p className="admin-sidebar__eyebrow">Thrive Formative</p>
            <p className="admin-sidebar__title">Clínica</p>
          </div>
          <div className="admin-scope-slot admin-scope-slot--sidebar">
            <ScopeBar />
          </div>
          <nav className="admin-nav" data-tour="shell-nav">
            {groups.map((group) => (
              <div key={group.label} className="admin-nav__block">
                <p className="admin-nav__group">{group.label}</p>
                {group.items.map((item) => {
                  const matched = item.exact ? pathname === item.href : pathname.startsWith(item.match || item.href);
                  const active = matched && !(item.exclude || []).some((prefix) => pathname.startsWith(prefix));
                  const Icon = item.icon;
                  return (
                    <Link key={item.href} href={item.href} className={`admin-nav__item${active ? " admin-nav__item--active" : ""}`}>
                      <Icon className="admin-nav__icon" size={17} strokeWidth={2} aria-hidden />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>
          <div className="admin-sidebar__footer">
            <p className="admin-sidebar__eyebrow">{staffName}</p>
            <div style={{ margin: "0.6rem 0" }}><ThemeSwitcher /></div>
            <button type="button" className="admin-nav__refresh" onClick={logout}>Salir</button>
          </div>
        </aside>
        <main className="admin-main">
          <header className="admin-topbar">
            <div className="admin-scope-slot admin-scope-slot--bar">
              <ScopeBar />
            </div>
            <div className="admin-topbar__tools">
            <NotificationBell variant="admin" />
            <AssistantDock pathname={pathname} permissions={permissions} />
            <TutorialButton pathname={pathname} />
            <details className="admin-create" data-tour="shell-create">
              <summary className="admin-btn admin-btn--primary">Crear</summary>
              <div className="admin-create__menu">
                <Link href="/admin/pacientes?nuevo=1">Paciente</Link>
                <Link href="/admin/leads?nuevo=1">Lead</Link>
                <Link href="/admin/calendario?nueva=1">Cita</Link>
                <Link href="/admin/cobrar">Cobro</Link>
              </div>
            </details>
            </div>
          </header>
          {children}
        </main>
      </div>
      </ClinicScopeProvider>
    </ThemeProvider>
  );
}
