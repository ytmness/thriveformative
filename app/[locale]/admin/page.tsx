import "@/app/styles/admin-booking.css";
import "@/app/styles/admin-cms.css";
import "@/app/styles/admin-cms-visual.css";
import "@/app/styles/admin-shell.css";
import ThemeProvider from "@/components/theme/ThemeProvider";
import ThemeSwitcher from "@/components/theme/ThemeSwitcher";
import Header from "@/components/Header";
import AdminDashboard from "@/components/admin/AdminDashboard";
import { isAdminAuthenticated } from "@/lib/adminSession";
import { redirect } from "next/navigation";

export default async function AdminPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!(await isAdminAuthenticated())) {
    redirect(`/${locale}/admin/login`);
  }

  return (
    <ThemeProvider>
      <ThemeSwitcher />
      <Header />
      <AdminDashboard locale={locale} />
    </ThemeProvider>
  );
}
