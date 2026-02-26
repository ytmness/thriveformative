"use client";

import { motion } from "framer-motion";
import { useTheme } from "@/components/theme/ThemeProvider";
import { useTranslations, useLocale } from "next-intl";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useUser, signOut } from "@/lib/useUser";
import { useRouter } from "next/navigation";

const WHATSAPP_LINK = "https://google.com";

const logoMap: Record<string, string> = {
  "golden-sand": "/logos/Logo-Golden-Sand-color-06.png",
  nocturnal: "/logos/Recurso-6-5x.png",
  metals: "/logos/Recurso-7-5x.png",
  "earth-modern": "/logos/Recurso-8-5x.png",
};

export default function Header() {
  const { theme } = useTheme();
  const t = useTranslations();
  const locale = useLocale();
  const { user, loading } = useUser();
  const router = useRouter();

  const currentLogo = logoMap[theme] || logoMap["nocturnal"];

  const navItems = [
    { key: "home", href: `/${locale}#inicio` },
    { key: "services", href: `/${locale}#servicios` },
    { key: "tshape", href: `/${locale}#tshape` },
    { key: "plans", href: `/${locale}#planes` },
    { key: "booking", href: `/${locale}#citas` },
    { key: "about", href: `/${locale}/info#doctor` },
    { key: "faq", href: `/${locale}/info#faq` },
    { key: "contact", href: `/${locale}/info#contacto` },
  ];

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="sticky top-0 z-40 backdrop-blur-md bg-[rgb(var(--bg)/0.85)] border-b border-theme"
    >
      <div className="w-full px-8 lg:px-12 py-3 md:py-4 min-h-[3.5rem] flex items-center">
        {/* Logo — links to home */}
        <motion.a
          href={`/${locale}`}
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.2 }}
          className="flex-shrink-0 mr-10 flex items-center"
        >
          <img
            src={currentLogo}
            alt="Thrive Formative"
            className="h-12 sm:h-14 md:h-16 w-auto object-contain max-h-[4.5rem]"
          />
        </motion.a>

        {/* Nav links — centered, spread out */}
        <nav className="hidden lg:flex items-center gap-10 xl:gap-12 text-base font-medium flex-1 justify-center">
          {navItems.map((item, i) => (
            <motion.a
              key={item.key}
              href={item.href}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.4 }}
              whileHover={{ color: "rgb(var(--primary))" }}
              className="hover:opacity-80 transition-all whitespace-nowrap"
            >
              {t(`nav.${item.key}`)}
            </motion.a>
          ))}
        </nav>

        {/* Right side — Auth + CTA + Language */}
        <div className="flex items-center gap-4 flex-shrink-0 ml-10">
          {!loading && (
            <>
              {user ? (
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted hidden sm:inline truncate max-w-[120px]">
                    {user.email}
                  </span>
                  <motion.a
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    href={`/${locale}#citas`}
                    className="text-sm font-medium text-[rgb(var(--primary))] hover:opacity-80"
                  >
                    {t("nav.booking")}
                  </motion.a>
                  <button
                    type="button"
                    onClick={() => { signOut(); router.refresh(); }}
                    className="text-sm text-muted hover:opacity-80"
                  >
                    {t("auth.signOut")}
                  </button>
                </div>
              ) : (
                <>
                  <motion.a
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    href={`/${locale}/login`}
                    className="text-sm font-medium hover:opacity-80"
                  >
                    {t("auth.loginTitle")}
                  </motion.a>
                  <motion.a
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    href={`/${locale}/register`}
                    className="btn-outline rounded-xl px-4 py-2 text-sm font-medium"
                  >
                    {t("auth.registerLink")}
                  </motion.a>
                </>
              )}
            </>
          )}
          <motion.a
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="btn-primary rounded-xl px-5 py-2.5 text-base font-medium shadow-lg hover:shadow-xl transition-shadow whitespace-nowrap"
            href={WHATSAPP_LINK}
            target="_blank"
            rel="noreferrer"
          >
            {t("nav.schedule")}
          </motion.a>
          <LanguageSwitcher />
        </div>
      </div>
    </motion.header>
  );
}
