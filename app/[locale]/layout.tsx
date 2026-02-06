import "../globals.css";
import type { Metadata } from "next";
import { Montserrat, Poppins } from "next/font/google";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { locales } from '@/i18n/config';

const montserrat = Montserrat({ subsets: ["latin"], variable: "--font-display" });
const poppins = Poppins({ subsets: ["latin"], weight: ["300","400","500","600"], variable: "--font-body" });

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

  return (
    <html lang={locale} className={`${montserrat.variable} ${poppins.variable}`}>
      <body>
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
