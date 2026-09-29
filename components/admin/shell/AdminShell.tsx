"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Calendar,
  ClipboardList,
  FileText,
  LayoutDashboard,
  MessageSquare,
  Package,
  Settings,
  ShoppingBag,
  Store,
  Users,
  Wallet,
  BarChart3,
  Contact,
} from "lucide-react";
import ThemeProvider from "@/components/theme/ThemeProvider";
import ThemeSwitcher from "@/components/theme/ThemeSwitcher";
import { api } from "@/components/admin/clinic/client";

const NAV = [
  { href: "/admin", label: "Dashboard", perm: "dashboard.read", icon: LayoutDashboard, exact: true },
  { href: "/admin/calendario", label: "Calendario", perm: "appointments.read", icon: Calendar },
  { href: "/admin/pacientes", label: "Pacientes", perm: "patients.read", icon: Users },
  { href: "/admin/leads", label: "Leads", perm: "leads.read", icon: Contact },
  { href: "/admin/ventas", label: "Ventas", perm: "sales.read", icon: ShoppingBag },
  { href: "/admin/facturas", label: "Facturas", perm: "invoices.read", icon: Wallet },
  { href: "/admin/productos", label: "Productos", perm: "inventory.read", icon: Package },
  { href: "/admin/formularios", label: "Formularios", perm: "forms.read", icon: ClipboardList },
  { href: "/admin/comunicaciones", label: "Comunicaciones", perm: "communications.read", icon: MessageSquare },
  { href: "/admin/reportes", label: "Reportes", perm: "reports.read", icon: BarChart3 },
  { href: "/admin/configuracion/sedes", label: "Configuración", perm: "settings.read", icon: Settings },
  { href: "/admin/contenido", label: "Contenido", perm: "settings.write", icon: FileText },
  { href: "/admin/tienda", label: "Tienda", perm: "settings.write", icon: Store },
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
  const items = NAV.filter((item) => permissions.includes(item.perm));

  async function logout() {
    await api("/api/admin/logout", { method: "POST" });
    router.replace("/admin/login");
    router.refresh();
  }

  return (
    <ThemeProvider>
      <div className="admin-shell">
        <aside className="admin-sidebar" aria-label="Navegación del panel">
          <div className="admin-sidebar__brand">
            <p className="admin-sidebar__eyebrow">Thrive Formative</p>
            <p className="admin-sidebar__title">Clínica</p>
          </div>
          <nav className="admin-nav">
            {items.map((item) => {
              const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href} className={`admin-nav__item${active ? " admin-nav__item--active" : ""}`}>
                  <Icon className="admin-nav__icon" size={17} strokeWidth={2} aria-hidden />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="admin-sidebar__footer">
            <p className="admin-sidebar__eyebrow">{staffName}</p>
            <div style={{ margin: "0.6rem 0" }}><ThemeSwitcher /></div>
            <button type="button" className="admin-nav__refresh" onClick={logout}>Salir</button>
          </div>
        </aside>
        <main className="admin-main">{children}</main>
      </div>
    </ThemeProvider>
  );
}
