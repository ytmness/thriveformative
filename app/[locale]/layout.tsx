import "../globals.css";
import "../styles/themes.css";
import "../styles/base.css";
import "../styles/utilities.css";
import "../styles/waves.css";
import "../styles/animations.css";
import "../styles/cursor.css";
import "../styles/scroll.css";
import "../styles/coming-soon.css";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Poppins } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { locales } from "@/i18n/config";
import PendingProfileSync from "@/components/PendingProfileSync";
import ComingSoonScreen from "@/components/ComingSoonScreen";

const poppins = Poppins({ subsets: ["latin"], weight: ["300","400","500","600","700"], variable: "--font-body" });

export const metadata: Metadata = {
  title: "Thrive Formative — Wellness from Within",
  description: "Medicina familiar y funcional, atención personalizada basada en evidencia.",
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
  const cookieStore = await cookies();
  const hasCookie = cookieStore.get("thrive_unlock")?.value === "1";
  const gateEnabled = Boolean(process.env.COMING_SOON_PASSWORD);
  const unlocked = hasCookie || !gateEnabled;

  return (
    <html lang={locale} className={`${poppins.variable}`}>
      <body>
        <NextIntlClientProvider messages={messages}>
          <PendingProfileSync />
          {unlocked ? children : <ComingSoonScreen />}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
