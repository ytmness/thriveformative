import BookingWizard from "@/components/booking/BookingWizard";
import "@/app/styles/admin-clinic.css";
import ThemeProvider from "@/components/theme/ThemeProvider";
export default function Page() {
  return <ThemeProvider><BookingWizard /></ThemeProvider>;
}
