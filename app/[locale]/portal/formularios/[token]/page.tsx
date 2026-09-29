import PortalApp from "@/components/portal/PortalApp";
import "@/app/styles/admin-clinic.css";
import ThemeProvider from "@/components/theme/ThemeProvider";
export default async function Page({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <ThemeProvider><PortalApp mode="form" token={token} /></ThemeProvider>;
}
