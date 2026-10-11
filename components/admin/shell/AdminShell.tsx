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
import { ClinicScopeProvider, ScopeBar, useAdminEnglish } from "@/components/admin/clinic/ClinicScope";
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

function navItems(english: boolean): NavItem[] {
  const day = english ? "Day to day" : "Día a día";
  const money = english ? "Money" : "Dinero";
  const catalog = english ? "Catalog" : "Catálogo";
  const site = english ? "Website" : "Sitio web";
  const clinic = english ? "Clinic" : "Clínica";
  return [
    { group: day, href: "/admin", label: "Dashboard", perms: ["dashboard.read"], icon: LayoutDashboard, exact: true },
    { group: day, href: "/admin/calendario", label: english ? "Calendar" : "Calendario", perms: ["appointments.read"], icon: Calendar },
    { group: day, href: "/admin/pacientes", label: english ? "Patients" : "Pacientes", perms: ["patients.read"], icon: Users },
    { group: day, href: "/admin/leads", label: "Leads", perms: ["leads.read"], icon: Contact },
    { group: money, href: "/admin/cobrar", label: english ? "Charge" : "Cobrar", perms: ["sales.read"], icon: CreditCard },
    { group: money, href: "/admin/ventas", label: english ? "Sales" : "Ventas", perms: ["sales.read"], icon: ShoppingBag },
    { group: money, href: "/admin/tienda/pedidos", label: english ? "Online orders" : "Pedidos en línea", perms: ["sales.read"], icon: Receipt },
    { group: money, href: "/admin/facturas", label: english ? "Invoices" : "Facturas", perms: ["invoices.read"], icon: Wallet },
    { group: catalog, href: "/admin/catalogo/servicios", label: english ? "Services and products" : "Servicios y productos", perms: ["inventory.read", "settings.read"], icon: Package, match: "/admin/catalogo" },
    { group: site, href: "/admin/contenido", label: english ? "Content" : "Contenido", perms: ["settings.write"], icon: FileText },
    { group: clinic, href: "/admin/formularios", label: english ? "Forms" : "Formularios", perms: ["forms.read"], icon: ClipboardList },
    { group: clinic, href: "/admin/comunicaciones", label: english ? "Messages" : "Comunicaciones", perms: ["communications.read"], icon: MessageSquare },
    { group: clinic, href: "/admin/reportes", label: english ? "Reports" : "Reportes", perms: ["reports.read"], icon: BarChart3, match: "/admin/reportes" },
    { group: clinic, href: "/admin/configuracion/horarios", label: english ? "Hours" : "Horarios", perms: ["settings.read"], icon: Clock, match: "/admin/configuracion/horarios" },
    { group: clinic, href: "/admin/configuracion/equipo", label: english ? "Team and roles" : "Equipo y roles", perms: ["settings.read"], icon: UserCog, match: "/admin/configuracion/equipo" },
    { group: clinic, href: "/admin/configuracion/sedes", label: english ? "Settings" : "Configuración", perms: ["settings.read"], icon: Settings, match: "/admin/configuracion", exclude: ["/admin/configuracion/horarios", "/admin/configuracion/equipo"] },
  ];
}

export default function AdminShell({
  staffName,
  permissions,
  children,
}: {
  staffName: string;
  permissions: string[];
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider>
      <ClinicScopeProvider>
        <AdminFrame staffName={staffName} permissions={permissions}>{children}</AdminFrame>
      </ClinicScopeProvider>
    </ThemeProvider>
  );
}

function AdminFrame({
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
  const english = useAdminEnglish();
  const items = navItems(english).filter((item) => item.perms.some((perm) => permissions.includes(perm)));
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
      <div className="admin-shell">
        <aside className="admin-sidebar" aria-label={english ? "Panel navigation" : "Navegación del panel"}>
          <div className="admin-sidebar__brand">
            <p className="admin-sidebar__eyebrow">Thrive Formative</p>
            <p className="admin-sidebar__title">{english ? "Clinic" : "Clínica"}</p>
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
            <button type="button" className="admin-nav__refresh" onClick={logout}>{english ? "Sign out" : "Salir"}</button>
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
            </div>
          </header>
          {children}
        </main>
      </div>
  );
}
