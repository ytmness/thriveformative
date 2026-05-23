import "@/app/styles/admin-booking.css";
import "@/app/styles/admin-cms.css";
import ThemeProvider from "@/components/theme/ThemeProvider";
import ThemeSwitcher from "@/components/theme/ThemeSwitcher";
import Header from "@/components/Header";
import AdminDashboard from "@/components/admin/AdminDashboard";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function AdminPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/login`);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || profile.role !== "admin") {
    redirect(`/${locale}`);
  }

  return (
    <ThemeProvider>
      <ThemeSwitcher />
      <Header />
      <AdminDashboard locale={locale} />
    </ThemeProvider>
  );
}

