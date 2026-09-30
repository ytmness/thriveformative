import "../globals.css";
import "../styles/themes.css";
import "../styles/base.css";
import "../styles/utilities.css";
import "../styles/hero-stats.css";
import "../styles/waves.css";
import "../styles/animations.css";
import "../styles/scroll.css";
import "../styles/booking.css";
import "../styles/header-nav.css";
import "../styles/brand-cta.css";
import type { Metadata } from "next";
import { Poppins, Playfair_Display } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { locales } from "@/i18n/config";

const poppins = Poppins({ subsets: ["latin"], weight: ["300","400","500","600","700"], variable: "--font-body" });
const playfair = Playfair_Display({ subsets: ["latin"], weight: ["400", "600", "700"], variable: "--font-serif" });

export const metadata: Metadata = {
  title: "Thrive Formative — Wellness from Within",
  description: "Medicina familiar y funcional, atención personalizada basada en evidencia.",
  icons: {
    icon: "/favicon.png",
    apple: "/favicon.png",
  },
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const messages = await getMessages();

  return (
    <html lang={locale} className={`${poppins.variable} ${playfair.variable}`}>
      <body>
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
