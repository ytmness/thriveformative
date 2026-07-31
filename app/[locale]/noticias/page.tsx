import ThemeProvider from "@/components/theme/ThemeProvider";
import DoctorNoticiasPage from "@/components/DoctorNoticiasPage";

export default async function NoticiasPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <ThemeProvider>
      <DoctorNoticiasPage locale={locale} />
    </ThemeProvider>
  );
}
