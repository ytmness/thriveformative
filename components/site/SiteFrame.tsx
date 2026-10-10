"use client";

import Footer from "@/components/Footer";
import Header from "@/components/Header";
import ThemeProvider from "@/components/theme/ThemeProvider";
import ThemeSwitcher from "@/components/theme/ThemeSwitcher";

export default function SiteFrame({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <ThemeSwitcher />
      <Header />
      <main className="booking-wizard">{children}</main>
      <Footer />
    </ThemeProvider>
  );
}
