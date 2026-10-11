"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { useAdminEnglish } from "@/components/admin/clinic/ClinicScope";
import { useUser } from "@/lib/useUser";

type NotificationRow = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  reference_id: string | null;
  read_at: string | null;
  created_at: string;
};

function clinicNotice(item: NotificationRow, english: boolean) {
  if (!english || item.type !== "appointment_pending" || !item.body) return { title: item.title, body: item.body };
  const match = item.body.match(/^(.*) acaba de agendar una cita de (.*) para el (\d{4}-\d{2}-\d{2}) a las (\d{2}:\d{2}) en (.*)\.$/);
  if (!match) return { title: "New appointment", body: item.body };
  return {
    title: "New appointment",
    body: `${match[1]} just booked a ${match[2]} appointment for ${match[3]} at ${match[4]} at ${match[5]}.`,
  };
}

export default function NotificationBell({ variant = "site" }: { variant?: "site" | "admin" }) {
  const { user } = useUser();
  const locale = useLocale();
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const unreadCount = notifications.filter((item) => !item.read_at).length;

  const endpoint = variant === "admin" ? "/api/admin/notifications" : "/api/portal/notifications";

  useEffect(() => {
    if (variant === "site" && !user) return;
    let cancelled = false;
    async function load() {
      const response = await fetch(endpoint, { credentials: "same-origin" });
      if (!response.ok) return;
      const body = (await response.json()) as { rows?: NotificationRow[] };
      if (!cancelled) setNotifications(body.rows ?? []);
    }
    load().catch(() => undefined);
    const timer = window.setInterval(() => { load().catch(() => undefined); }, 30000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [user, endpoint, variant]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function markRead(id: string) {
    await fetch(endpoint, {
      method: "PATCH",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setNotifications((prev) => prev.map((item) => (item.id === id ? { ...item, read_at: new Date().toISOString() } : item)));
  }

  const panelEnglish = useAdminEnglish();
  const english = variant === "admin" ? panelEnglish : locale === "en";
  const label = english
    ? unreadCount > 0
      ? `${unreadCount} unread notifications`
      : "Notifications"
    : unreadCount > 0
      ? `${unreadCount} notificaciones sin leer`
      : "Notificaciones";
  const sitePanel = "absolute right-0 mt-2 w-80 max-h-[min(24rem,70vh)] overflow-auto rounded-xl border border-theme bg-[rgb(var(--bg))] shadow-lg z-50";

  return (
    <div className={variant === "admin" ? "admin-bell" : "relative"} ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={variant === "admin" ? "admin-bell__btn" : "site-nav__bell"}
        aria-label={label}
        aria-expanded={open}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
        {unreadCount > 0 ? (
          <span className={variant === "admin" ? "admin-bell__count" : "absolute -top-0.5 -right-0.5 min-w-[1.25rem] h-5 px-1 flex items-center justify-center rounded-full bg-red-500 text-white text-xs font-medium"}>
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        ) : null}
      </button>
      {open ? (
        <div className={variant === "admin" ? "admin-bell__panel" : sitePanel}>
          <div className={variant === "admin" ? "admin-bell__head" : "p-3 border-b border-theme font-medium text-sm"}>{english ? "Notifications" : "Notificaciones"}</div>
          <div>
            {variant === "site" && !user ? (
              <div className="p-4 text-sm">
                <a href={`/${locale}/login`} className="text-[rgb(var(--primary))] hover:underline">{english ? "Sign in" : "Inicia sesión"}</a>
                <span className="text-muted">{english ? " to see your appointment notices." : " para ver los avisos de tus citas."}</span>
              </div>
            ) : notifications.length === 0 ? (
              <div className={variant === "admin" ? "admin-bell__empty" : "p-4 text-sm text-muted"}>{english ? "No notifications." : "No hay notificaciones."}</div>
            ) : (
              notifications.map((item) => {
                const notice = clinicNotice(item, english && variant === "admin");
                const chartHref = variant === "admin" && item.type.startsWith("appointment_") ? "/admin/calendario" : null;
                return (
                <div key={item.id} className={variant === "admin" ? `admin-bell__item${!item.read_at ? " is-unread" : ""}` : `p-3 text-sm ${!item.read_at ? "bg-[rgb(var(--primary)/0.08)]" : ""}`}>
                  <div className="font-medium">{chartHref ? <Link href={chartHref}>{notice.title}</Link> : notice.title}</div>
                  {notice.body ? <div className={variant === "admin" ? "admin-bell__body" : "text-muted text-xs mt-0.5"}>{notice.body}</div> : null}
                  <div className={variant === "admin" ? "admin-bell__time" : "text-muted text-xs mt-1"}>
                    {new Date(item.created_at).toLocaleString(english ? "en-US" : locale)}
                  </div>
                  {!item.read_at ? (
                    <button type="button" onClick={() => markRead(item.id)} className={variant === "admin" ? "admin-bell__read" : "mt-2 text-xs text-[rgb(var(--primary))] hover:underline"}>
                      {english ? "Mark as read" : "Marcar leído"}
                    </button>
                  ) : null}
                </div>
                );
              })
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
