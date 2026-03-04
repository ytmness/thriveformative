"use client";

import { useEffect, useState, useRef } from "react";
import { useLocale } from "next-intl";
import { createClient } from "@/lib/supabase";
import { useUser } from "@/lib/useUser";

type NotificationRow = {
  id: string;
  user_id: string | null;
  type: string;
  title: string;
  body: string | null;
  reference_id: string | null;
  read_at: string | null;
  created_at: string;
};

export default function NotificationBell() {
  const { user, role } = useUser();
  const locale = useLocale();
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read_at).length;

  useEffect(() => {
    if (!user) return;
    const supabase = createClient();
    const base = supabase
      .from("notifications")
      .select("id,user_id,type,title,body,reference_id,read_at,created_at")
      .order("created_at", { ascending: false })
      .limit(20);

    const query = role === "admin" ? base.is("user_id", null) : base.eq("user_id", user.id);
    query.then(({ data }) => setNotifications((data ?? []) as NotificationRow[]));
  }, [user?.id, role]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function markRead(id: string) {
    const supabase = createClient();
    await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("id", id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n))
    );
  }

  if (!user) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg border border-theme hover:bg-[rgb(var(--surface))] transition-colors"
        aria-label={unreadCount > 0 ? `${unreadCount} notificaciones sin leer` : "Notificaciones"}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="lucide lucide-bell"
        >
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[1.25rem] h-5 px-1 flex items-center justify-center rounded-full bg-red-500 text-white text-xs font-medium">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-h-[min(24rem,70vh)] overflow-auto rounded-xl border border-theme bg-[rgb(var(--bg))] shadow-lg z-50">
          <div className="p-3 border-b border-theme font-medium text-sm">Notificaciones</div>
          <div className="divide-y divide-[rgb(var(--border)/0.3)]">
            {notifications.length === 0 ? (
              <div className="p-4 text-sm text-muted">No hay notificaciones.</div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`p-3 text-sm ${!n.read_at ? "bg-[rgb(var(--primary)/0.08)]" : ""}`}
                >
                  <div className="font-medium">{n.title}</div>
                  {n.body && <div className="text-muted text-xs mt-0.5 truncate">{n.body}</div>}
                  <div className="text-muted text-xs mt-1">
                    {new Date(n.created_at).toLocaleString(locale)}
                  </div>
                  {!n.read_at && (
                    <button
                      type="button"
                      onClick={() => markRead(n.id)}
                      className="mt-2 text-xs text-[rgb(var(--primary))] hover:underline"
                    >
                      Marcar leído
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
