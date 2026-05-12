"use client";

import { motion } from "framer-motion";
import { useTranslations, useLocale } from "next-intl";
import { SITE_LOGO_SRC } from "@/lib/branding";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useUser, signOut } from "@/lib/useUser";
import { useRouter, usePathname } from "next/navigation";
import NotificationBell from "@/components/NotificationBell";
import { useEffect, useState } from "react";

const WHATSAPP_LINK = "https://google.com";

type NavItem = { key: string; href: string; label?: string };

function normalizePath(p: string) {
  if (!p || p === "") return "/";
  return p.replace(/\/$/, "") || "/";
}

function isNavLinkActive(href: string, pathname: string, hash: string): boolean {
  const i = href.indexOf("#");
  const pathPart = i >= 0 ? href.slice(0, i) : href;
  const expectedHash = i >= 0 ? href.slice(i) : "";

  if (normalizePath(pathPart) !== normalizePath(pathname)) {
    return false;
  }
  if (!expectedHash) return true;

  const current = hash || "";
  if (expectedHash === "#inicio") {
    return current === "#inicio" || current === "";
  }
  return current === expectedHash;
}

function useLocationHash() {
  const [hash, setHash] = useState("");
  useEffect(() => {
    const sync = () => setHash(typeof window !== "undefined" ? window.location.hash : "");
    sync();
    window.addEventListener("hashchange", sync);
    window.addEventListener("popstate", sync);
    return () => {
      window.removeEventListener("hashchange", sync);
      window.removeEventListener("popstate", sync);
    };
  }, []);
  return hash;
}

export default function Header() {
  const t = useTranslations();
  const locale = useLocale();
  const pathname = usePathname();
  const locationHash = useLocationHash();
  const { user, role, loading } = useUser();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const primaryNavItems: NavItem[] = [
    { key: "home", href: `/${locale}#inicio` },
    { key: "services", href: `/${locale}#servicios` },
    { key: "doctor", href: `/${locale}/info#doctor` },
    { key: "tshape", href: `/${locale}#tshape` },
    { key: "shapescale", href: `/${locale}/shapescale` },
    { key: "plans", href: `/${locale}#planes` },
    ...(role === "doctor" || role === "admin"
      ? ([{ key: "news", href: `/${locale}/noticias` }] as const)
      : []),
    { key: "faq", href: `/${locale}/info#faq` },
  ];

  const secondaryMobileItems: NavItem[] = [
    { key: "booking", href: `/${locale}#citas` },
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
      className="site-nav sticky top-0 z-40"
    >
      <div className="site-nav__inner">
        <motion.a
          href={`/${locale}`}
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.2 }}
          className="site-nav__brand"
        >
          <img
            src={SITE_LOGO_SRC}
            alt="Thrive Formative"
            className="h-10 sm:h-12 md:h-14 lg:h-14 w-auto object-contain max-h-[4rem]"
          />
        </motion.a>

        <nav className="site-nav__links" aria-label="Principal">
          {primaryNavItems.map((item, i) => {
            const active = isNavLinkActive(item.href, pathname, locationHash);
            return (
              <motion.a
                key={item.key}
                href={item.href}
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06, duration: 0.35 }}
                className={`site-nav__link ${active ? "site-nav__link--active" : ""}`}
              >
                {"label" in item && item.label ? item.label : t(`nav.${item.key}`)}
              </motion.a>
            );
          })}
        </nav>

        <div className="site-nav__actions">
          {!loading && (
            <>
              {user ? (
                <div className="flex items-center gap-2 sm:gap-3">
                  <span className="type-ui-muted hidden xl:inline truncate max-w-[100px] text-xs">
                    {user.email}
                  </span>
                  {role === "admin" && (
                    <motion.a
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      href={`/${locale}/admin`}
                      className="type-ui text-xs font-medium hover:opacity-80 whitespace-nowrap"
                    >
                      Admin
                    </motion.a>
                  )}
                  <motion.a
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    href={`/${locale}#citas`}
                    className="type-ui text-xs font-medium text-[rgb(var(--primary))] hover:opacity-80 hidden xl:inline"
                  >
                    {t("nav.booking")}
                  </motion.a>
                  <button
                    type="button"
                    onClick={() => {
                      signOut();
                      router.refresh();
                    }}
                    className="type-ui-muted hover:opacity-80 text-xs"
                  >
                    {t("auth.signOut")}
                  </button>
                  <NotificationBell />
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <motion.a
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    href={`/${locale}/login`}
                    className="type-ui text-xs font-medium hover:opacity-80"
                  >
                    {t("auth.loginTitle")}
                  </motion.a>
                  <motion.a
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    href={`/${locale}/register`}
                    className="btn-outline type-ui text-xs font-medium rounded-lg px-3 py-1.5"
                  >
                    {t("auth.registerLink")}
                  </motion.a>
                </div>
              )}
            </>
          )}
          <div className="site-nav__lang">
            <LanguageSwitcher variant="minimal" />
          </div>
          <motion.a
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            className="site-nav__cta"
            href={WHATSAPP_LINK}
            target="_blank"
            rel="noreferrer"
          >
            {t("nav.schedule")}
          </motion.a>
        </div>

        <div className="flex lg:hidden items-center gap-2 flex-shrink-0">
          <div className="site-nav__lang">
            <LanguageSwitcher variant="minimal" />
          </div>
          <button
            type="button"
            aria-label={mobileMenuOpen ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="site-nav__mobile-toggle"
          >
            <span className="text-xl leading-none">{mobileMenuOpen ? "×" : "☰"}</span>
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="site-nav__mobile-panel lg:hidden">
          <nav className="px-4 py-3 flex flex-col" aria-label="Móvil">
            {primaryNavItems.map((item) => {
              const active = isNavLinkActive(item.href, pathname, locationHash);
              return (
                <a
                  key={item.key}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`site-nav__mobile-link ${active ? "site-nav__mobile-link--active" : ""}`}
                >
                  {"label" in item && item.label ? item.label : t(`nav.${item.key}`)}
                </a>
              );
            })}
            {secondaryMobileItems.map((item) => {
              const active = isNavLinkActive(item.href, pathname, locationHash);
              return (
                <a
                  key={item.key}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`site-nav__mobile-link ${active ? "site-nav__mobile-link--active" : ""}`}
                >
                  {t(`nav.${item.key}`)}
                </a>
              );
            })}
          </nav>

          <div className="px-4 pb-5 flex flex-col gap-3 border-t border-[rgb(var(--border)/0.12)] pt-4">
            {!loading && (
              <>
                {user ? (
                  <>
                    <span className="type-ui-muted truncate text-sm">{user.email}</span>
                    {role === "admin" && (
                      <a
                        href={`/${locale}/admin`}
                        onClick={() => setMobileMenuOpen(false)}
                        className="type-ui font-medium text-sm"
                      >
                        Admin
                      </a>
                    )}
                    <a
                      href={`/${locale}#citas`}
                      onClick={() => setMobileMenuOpen(false)}
                      className="type-ui font-medium text-[rgb(var(--primary))] text-sm"
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
                      className="type-ui-muted text-left text-sm"
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
                      className="type-ui font-medium text-sm"
                    >
                      {t("auth.loginTitle")}
                    </a>
                    <a
                      href={`/${locale}/register`}
                      onClick={() => setMobileMenuOpen(false)}
                      className="btn-outline type-ui font-medium rounded-xl px-4 py-2 text-center text-sm"
                    >
                      {t("auth.registerLink")}
                    </a>
                  </>
                )}
              </>
            )}

            <a
              className="site-nav__cta text-center py-3"
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
