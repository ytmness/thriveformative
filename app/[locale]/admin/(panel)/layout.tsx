import "@/app/styles/admin-shell.css";
import "@/app/styles/admin-clinic.css";
import AdminShell from "@/components/admin/shell/AdminShell";
import { getStaffSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const session = await getStaffSession();
  if (!session) redirect("/admin/login");
  return (
    <AdminShell staffName={`${session.staff.firstName} ${session.staff.lastName}`} permissions={session.permissions}>
      {children}
    </AdminShell>
  );
}
