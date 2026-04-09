"use client";

import { motion } from "framer-motion";
import { useTheme } from "@/components/theme/ThemeProvider";
import { useTranslations, useLocale } from "next-intl";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useUser, signOut } from "@/lib/useUser";
import { useRouter } from "next/navigation";
import NotificationBell from "@/components/NotificationBell";
import { useEffect, useState } from "react";

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
  const { user, role, loading } = useUser();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const currentLogo = logoMap[theme] || logoMap["nocturnal"];

  const navItems = [
    { key: "home", href: `/${locale}#inicio` },
    { key: "services", href: `/${locale}#servicios` },
    { key: "tshape", href: `/${locale}#tshape` },
    { key: "plans", href: `/${locale}#planes` },
    { key: "booking", href: `/${locale}#citas` },
    ...(role === "admin" ? [{ key: "admin", href: `/${locale}/admin`, label: "Admin" }] : []),
    { key: "about", href: `/${locale}/info#doctor` },
    { key: "faq", href: `/${locale}/info#faq` },
    { key: "contact", href: `/${locale}/info#contacto` },
  ];

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [mobileMenuOpen]);

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="sticky top-0 z-40 backdrop-blur-md bg-[rgb(var(--bg)/0.85)] border-b border-theme"
    >
      <div className="w-full px-4 md:px-6 lg:px-12 py-3 md:py-4 min-h-[3.5rem] flex items-center justify-between">
        {/* Logo — links to home */}
        <motion.a
          href={`/${locale}`}
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.2 }}
          className="flex-shrink-0 lg:mr-10 flex items-center"
        >
          <img
            src={currentLogo}
            alt="Thrive Formative"
            className="h-10 sm:h-12 md:h-14 lg:h-16 w-auto object-contain max-h-[4.5rem]"
          />
        </motion.a>

        {/* Nav links — centered, spread out */}
        <nav className="hidden lg:flex items-center gap-10 xl:gap-12 type-nav flex-1 justify-center">
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
              {"label" in item ? item.label : t(`nav.${item.key}`)}
            </motion.a>
          ))}
        </nav>

        {/* Right side — Auth + CTA + Language */}
        <div className="hidden lg:flex items-center gap-4 flex-shrink-0 ml-10">
          {!loading && (
            <>
              {user ? (
                <div className="flex items-center gap-3">
                  <span className="type-ui-muted hidden sm:inline truncate max-w-[120px]">
                    {user.email}
                  </span>
                  {role === "admin" && (
                    <motion.a
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      href={`/${locale}/admin`}
                      className="type-ui font-medium hover:opacity-80 whitespace-nowrap"
                    >
                      Admin
                    </motion.a>
                  )}
                  <motion.a
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    href={`/${locale}#citas`}
                    className="type-ui font-medium text-[rgb(var(--primary))] hover:opacity-80"
                  >
                    {t("nav.booking")}
                  </motion.a>
                  <button
                    type="button"
                    onClick={() => { signOut(); router.refresh(); }}
                    className="type-ui-muted hover:opacity-80"
                  >
                    {t("auth.signOut")}
                  </button>
                  <NotificationBell />
                </div>
              ) : (
                <>
                  <motion.a
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    href={`/${locale}/login`}
                    className="type-ui font-medium hover:opacity-80"
                  >
                    {t("auth.loginTitle")}
                  </motion.a>
                  <motion.a
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    href={`/${locale}/register`}
                    className="btn-outline type-ui font-medium rounded-xl px-4 py-2"
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
            className="btn-primary type-btn rounded-xl px-5 py-2.5 shadow-lg hover:shadow-xl transition-shadow whitespace-nowrap"
            href={WHATSAPP_LINK}
            target="_blank"
            rel="noreferrer"
          >
            {t("nav.schedule")}
          </motion.a>
          <LanguageSwitcher />
        </div>

        {/* Mobile right side — language + hamburger */}
        <div className="flex lg:hidden items-center gap-2">
          <LanguageSwitcher />
          <button
            type="button"
            aria-label={mobileMenuOpen ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="inline-flex items-center justify-center w-11 h-11 rounded-xl border border-theme bg-[rgb(var(--surface)/0.8)]"
          >
            <span className="text-xl leading-none">{mobileMenuOpen ? "×" : "☰"}</span>
          </button>
        </div>
      </div>

      {/* Mobile menu panel */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-theme bg-[rgb(var(--bg)/0.98)] backdrop-blur-md">
          <nav className="px-4 py-4 flex flex-col gap-3">
            {navItems.map((item) => (
              <a
                key={item.key}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="type-nav py-2 border-b border-[rgb(var(--border)/0.15)]"
              >
                {"label" in item ? item.label : t(`nav.${item.key}`)}
              </a>
            ))}
          </nav>

          <div className="px-4 pb-5 flex flex-col gap-3">
            {!loading && (
              <>
                {user ? (
                  <>
                    <span className="type-ui-muted truncate">{user.email}</span>
                    {role === "admin" && (
                      <a
                        href={`/${locale}/admin`}
                        onClick={() => setMobileMenuOpen(false)}
                        className="type-ui font-medium"
                      >
                        Admin
                      </a>
                    )}
                    <a
                      href={`/${locale}#citas`}
                      onClick={() => setMobileMenuOpen(false)}
                      className="type-ui font-medium text-[rgb(var(--primary))]"
                    >
                      {t("nav.booking")}
                    </a>
                    <button
                      type="button"
                      onClick={() => {
                        signOut();
                        router.refresh();
                        setMobileMenuOpen(false);
                      }}
                      className="type-ui-muted text-left"
                    >
                      {t("auth.signOut")}
                    </button>
                    <div className="pt-1">
                      <NotificationBell />
                    </div>
                  </>
                ) : (
                  <>
                    <a
                      href={`/${locale}/login`}
                      onClick={() => setMobileMenuOpen(false)}
                      className="type-ui font-medium"
                    >
                      {t("auth.loginTitle")}
                    </a>
                    <a
                      href={`/${locale}/register`}
                      onClick={() => setMobileMenuOpen(false)}
                      className="btn-outline type-ui font-medium rounded-xl px-4 py-2 text-center"
                    >
                      {t("auth.registerLink")}
                    </a>
                  </>
                )}
              </>
            )}

            <a
              className="btn-primary type-btn rounded-xl px-5 py-3 shadow-lg text-center"
              href={WHATSAPP_LINK}
              target="_blank"
              rel="noreferrer"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t("nav.schedule")}
            </a>
          </div>
        </div>
      )}
    </motion.header>
  );
}
