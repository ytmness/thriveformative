"use client";

import { motion } from "framer-motion";
import { useTranslations, useLocale } from "next-intl";
import { SITE_LOGO_SRC, WHATSAPP_LINK } from "@/lib/branding";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useUser, signOut } from "@/lib/useUser";
import { useRouter, usePathname } from "next/navigation";
import NotificationBell from "@/components/NotificationBell";
import { useCallback, useEffect, useState, type RefObject } from "react";

type NavItem = { key: string; href: string; label?: string; hashOnly?: boolean };

export type HeaderPreviewConfig = {
  scrollRef: RefObject<HTMLElement | null>;
  /** Ruta ficticia para resaltar enlaces (p. ej. /es/admin) */
  pathname?: string;
};

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

type HeaderProps = {
  preview?: HeaderPreviewConfig;
};

export default function Header({ preview }: HeaderProps = {}) {
  const t = useTranslations();
  const locale = useLocale();
  const sitePathname = usePathname();
  const pathname = preview?.pathname ?? sitePathname;
  const locationHash = useLocationHash();
  const [previewHash, setPreviewHash] = useState("#inicio");
  const { user, role, loading } = useUser();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const activeHash = preview ? previewHash : locationHash;

  const primaryNavItems: NavItem[] = preview
    ? [
        { key: "home", href: `#inicio`, hashOnly: true },
        { key: "services", href: `#servicios`, hashOnly: true },
        { key: "tshape", href: `#tshape`, hashOnly: true },
        { key: "plans", href: `#planes`, hashOnly: true },
        { key: "booking", href: `#citas`, hashOnly: true },
        { key: "news", href: `#noticias`, hashOnly: true, label: t("nav.news") },
      ]
    : [
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

  const scrollPreviewTo = useCallback(
    (hash: string) => {
      const root = preview?.scrollRef.current;
      if (!root) return;
      const id = hash.replace(/^#/, "");
      const el = root.querySelector<HTMLElement>(`#${CSS.escape(id)}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        setPreviewHash(hash.startsWith("#") ? hash : `#${hash}`);
      }
    },
    [preview]
  );

  useEffect(() => {
    if (!preview?.scrollRef.current) return;
    const root = preview.scrollRef.current;
    const sectionIds = ["inicio", "servicios", "tshape", "planes", "citas", "noticias"];

    const syncActive = () => {
      const rootRect = root.getBoundingClientRect();
      let current = "#inicio";
      for (const id of sectionIds) {
        const el = root.querySelector<HTMLElement>(`#${CSS.escape(id)}`);
        if (!el) continue;
        const top = el.getBoundingClientRect().top - rootRect.top;
        if (top <= 120) current = `#${id}`;
      }
      setPreviewHash(current);
    };

    syncActive();
    root.addEventListener("scroll", syncActive, { passive: true });
    return () => root.removeEventListener("scroll", syncActive);
  }, [preview]);

  function handleNavClick(
    e: React.MouseEvent<HTMLAnchorElement>,
    item: NavItem
  ) {
    if (!preview || !item.hashOnly) return;
    e.preventDefault();
    const hash = item.href.includes("#") ? item.href.slice(item.href.indexOf("#")) : item.href;
    scrollPreviewTo(hash);
    setMobileMenuOpen(false);
  }

  function navActive(item: NavItem) {
    if (preview && item.hashOnly) {
      const expected = item.href.startsWith("#") ? item.href : `#${item.href}`;
      return activeHash === expected || (expected === "#inicio" && activeHash === "");
    }
    return isNavLinkActive(item.href, pathname, activeHash);
  }

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
          href={preview ? "#inicio" : `/${locale}`}
          onClick={preview ? (e) => handleNavClick(e, { key: "home", href: "#inicio", hashOnly: true }) : undefined}
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
            const active = navActive(item);
            return (
              <motion.a
                key={item.key}
                href={preview && item.hashOnly ? item.href : item.href}
                onClick={(e) => handleNavClick(e, item)}
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
          {preview ? (
            <span className="site-nav__preview-badge type-ui-muted text-xs hidden sm:inline">
              Vista previa
            </span>
          ) : null}
          {!preview && !loading && (
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
          {!preview ? (
            <>
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
            </>
          ) : null}
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
              const active = navActive(item);
              return (
                <a
                  key={item.key}
                  href={item.href}
                  onClick={(e) => {
                    handleNavClick(e, item);
                    if (!preview) setMobileMenuOpen(false);
                  }}
                  className={`site-nav__mobile-link ${active ? "site-nav__mobile-link--active" : ""}`}
                >
                  {"label" in item && item.label ? item.label : t(`nav.${item.key}`)}
                </a>
              );
            })}
            {!preview
              ? secondaryMobileItems.map((item) => {
                  const active = isNavLinkActive(item.href, pathname, activeHash);
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
                })
              : null}
          </nav>

          <div className="px-4 pb-5 flex flex-col gap-3 border-t border-[rgb(var(--border)/0.12)] pt-4">
            {!preview && !loading && (
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

            {!preview ? (
              <a
                className="site-nav__cta text-center py-3"
                href={WHATSAPP_LINK}
                target="_blank"
                rel="noreferrer"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t("nav.schedule")}
              </a>
            ) : null}
          </div>
        </div>
      )}
    </motion.header>
  );
}
