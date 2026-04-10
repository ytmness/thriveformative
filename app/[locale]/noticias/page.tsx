import ThemeProvider from "@/components/theme/ThemeProvider";
import DoctorNoticiasPage from "@/components/DoctorNoticiasPage";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

const ALLOWED_ROLES = new Set(["doctor", "admin"]);

export default async function NoticiasPage({
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

  if (!profile?.role || !ALLOWED_ROLES.has(profile.role)) {
    redirect(`/${locale}`);
  }

  return (
    <ThemeProvider>
      <DoctorNoticiasPage locale={locale} />
    </ThemeProvider>
  );
}
