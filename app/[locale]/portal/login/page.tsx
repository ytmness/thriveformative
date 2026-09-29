import PortalApp from "@/components/portal/PortalApp";
import "@/app/styles/admin-clinic.css";
import ThemeProvider from "@/components/theme/ThemeProvider";
export default function Page() { return <ThemeProvider><PortalApp mode="login" /></ThemeProvider>; }
