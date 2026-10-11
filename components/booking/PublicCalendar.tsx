"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { api } from "@/components/admin/clinic/client";
import { useUser } from "@/lib/useUser";

type Slot = { start: string; end: string; roomId: string | null };
type Group = { staffUserId: string; staffName: string; locationId: string; locationName: string; timezone?: string; slots: Slot[] };
type Catalog = {
  services: { id: string; name: string; duration_minutes: number; locked?: boolean }[];
  locations: { id: string; name: string }[];
  settings: { max_advance_days?: number; require_terms?: boolean } | null;
  policy: { text?: string } | null;
};

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function dateKey(year: number, month: number, day: number) {
  return `${year}-${pad(month + 1)}-${pad(day)}`;
}

export default function PublicCalendar() {
  const t = useTranslations("booking");
  const locale = useLocale();
  const { user, loading: accountLoading } = useUser();
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [serviceId, setServiceId] = useState("");
  const [locationId, setLocationId] = useState("");
  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const [selected, setSelected] = useState("");
  const [openDays, setOpenDays] = useState<Set<string> | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slot, setSlot] = useState<(Slot & { staffUserId: string; locationId: string }) | null>(null);
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phone: "", acceptTerms: false });
  const [done, setDone] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.email) return;
    const parts = (user.name || "").trim().split(/\s+/).filter(Boolean);
    setForm((current) => ({
      ...current,
      email: user.email,
      firstName: current.firstName || parts[0] || "",
      lastName: current.lastName || parts.slice(1).join(" "),
    }));
  }, [user]);

  useEffect(() => {
    if (!user) return;
    api<Catalog>("/api/public/booking/catalog")
      .then((data) => {
        setCatalog(data);
        setServiceId(data.services.find((service) => !service.locked)?.id || "");
        setLocationId(data.locations[0]?.id || "");
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Error"));
  }, [user]);

  const monthKey = `${cursor.year}-${pad(cursor.month + 1)}`;

  useEffect(() => {
    if (!user || !serviceId) return;
    let cancelled = false;
    setOpenDays(null);
    setSelected("");
    setSlot(null);
    api<{ dates: string[] }>(`/api/public/booking/availability?serviceId=${serviceId}&locationId=${locationId}&month=${monthKey}`)
      .then((result) => {
        if (!cancelled) setOpenDays(new Set(result.dates));
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Error");
      });
    return () => {
      cancelled = true;
    };
  }, [user, serviceId, locationId, monthKey]);

  useEffect(() => {
    if (!user || !serviceId || !selected) return;
    setLoadingSlots(true);
    setSlot(null);
    api<{ slots: Group[] }>(`/api/public/booking/availability?serviceId=${serviceId}&date=${selected}&locationId=${locationId}`)
      .then((result) => setGroups(result.slots))
      .catch((err) => setError(err instanceof Error ? err.message : "Error"))
      .finally(() => setLoadingSlots(false));
  }, [user, serviceId, selected, locationId]);

  const today = new Date();
  const todayKey = dateKey(today.getFullYear(), today.getMonth(), today.getDate());
  const maxDays = catalog?.settings?.max_advance_days ?? 90;
  const limit = new Date(today);
  limit.setDate(limit.getDate() + maxDays);
  const limitKey = dateKey(limit.getFullYear(), limit.getMonth(), limit.getDate());
  const weekdays = t("dow").split(",");
  const cells = useMemo(() => {
    const first = new Date(cursor.year, cursor.month, 1);
    const padCount = (first.getDay() + 6) % 7;
    const count = new Date(cursor.year, cursor.month + 1, 0).getDate();
    const next: (number | null)[] = Array.from({ length: padCount }, () => null);
    for (let day = 1; day <= count; day += 1) next.push(day);
    while (next.length % 7) next.push(null);
    return next;
  }, [cursor.year, cursor.month]);
  const monthLabel = new Date(cursor.year, cursor.month, 1).toLocaleDateString(locale, { month: "long", year: "numeric" });

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!slot) return;
    setError(null);
    try {
      const result = await api<{ manageToken: string | null }>("/api/public/booking", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          serviceId,
          locationId: slot.locationId,
          staffUserId: slot.staffUserId,
          roomId: slot.roomId,
          startsAt: slot.start,
          endsAt: slot.end,
        }),
      });
      setDone(result.manageToken);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    }
  }

  if (accountLoading) {
    return <p className="booking-gate">{t("checkingAccount")}</p>;
  }

  if (!user) {
    return (
      <div className="booking-gate">
        <p className="booking-gate__title">{t("registerToBook")}</p>
        <p className="booking-gate__hint">{t("registerToBookHint")}</p>
        <div className="booking-gate__actions">
          <Link href={`/${locale}/register`} className="btn-primary">{t("registerToBookCta")}</Link>
          <Link href={`/${locale}/login`} className="booking-gate__login">{t("loginToBook")}</Link>
        </div>
      </div>
    );
  }

  if (done !== null) {
    return (
      <div className="booking-done">
        <h3>{t("booked")}</h3>
        {done ? <a href={`/reservar/${done}`}>{t("manage")}</a> : null}
      </div>
    );
  }

  return (
    <div className="booking-picker">
      {error ? <div className="booking-error" role="alert">{error}</div> : null}
      <div className="booking-picker__choices">
        <label>
          <span>{t("service")}</span>
          <select value={serviceId} onChange={(event) => setServiceId(event.target.value)}>
            {catalog?.services.filter((service) => !service.locked).map((service) => (
              <option key={service.id} value={service.id}>{service.name} · {service.duration_minutes} min</option>
            ))}
          </select>
        </label>
        <label>
          <span>{t("location")}</span>
          <select value={locationId} onChange={(event) => setLocationId(event.target.value)}>
            {catalog?.locations.map((location) => (
              <option key={location.id} value={location.id}>{location.name}</option>
            ))}
          </select>
        </label>
      </div>
      {catalog?.services.some((service) => service.locked) ? <p className="booking-picker__lock">{t("planUnlockHint")}</p> : null}
      <div className="booking-section__layout">
        <div className="booking-cal-wrap">
          <div className="booking-cal">
            <div className="booking-cal__shell">
              <p className="booking-cal__label">{t("dateLabel")}</p>
              <div className="booking-cal__nav">
                <button type="button" className="booking-cal__nav-btn" aria-label="Anterior" onClick={() => setCursor((current) => {
                  const month = current.month - 1;
                  return month < 0 ? { year: current.year - 1, month: 11 } : { year: current.year, month };
                })}>‹</button>
                <span className="booking-cal__month">{monthLabel}</span>
                <button type="button" className="booking-cal__nav-btn" aria-label="Siguiente" onClick={() => setCursor((current) => {
                  const month = current.month + 1;
                  return month > 11 ? { year: current.year + 1, month: 0 } : { year: current.year, month };
                })}>›</button>
              </div>
              <div className="booking-cal__dow" role="row">
                {weekdays.map((name) => <div key={name} className="booking-cal__dow-cell" role="columnheader">{name}</div>)}
              </div>
              <div className="booking-cal__grid" role="grid">
                {cells.map((day, index) => {
                  if (!day) return <button key={`pad-${index}`} type="button" className="booking-cal__day booking-cal__day--pad" disabled />;
                  const key = dateKey(cursor.year, cursor.month, day);
                  const bookable = key >= todayKey && key <= limitKey && openDays?.has(key) === true;
                  return (
                    <button
                      key={key}
                      type="button"
                      disabled={!bookable}
                      className={`booking-cal__day${!bookable ? " booking-cal__day--blocked" : ""}${selected === key ? " booking-cal__day--selected" : ""}`}
                      onClick={() => setSelected(key)}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
        <div className="booking-slots">
          <div className="booking-slots__shell">
            <p className="booking-slots__label">{t("slotsLabel")}</p>
            {!selected ? <p className="booking-slots__empty">{t("pickDay")}</p> : null}
            {selected && loadingSlots ? <p className="booking-slots__empty">…</p> : null}
            {selected && !loadingSlots && !groups.some((group) => group.slots.length) ? <p className="booking-slots__empty">{t("noSlots")}</p> : null}
            <div className="booking-slots__grid">
              {groups.flatMap((group) => group.slots.map((item) => (
                <button
                  key={`${group.staffUserId}-${item.start}`}
                  type="button"
                  className={`booking-slot${slot?.start === item.start && slot.staffUserId === group.staffUserId ? " booking-slot--selected" : ""}`}
                  onClick={() => setSlot({ ...item, staffUserId: group.staffUserId, locationId: group.locationId })}
                >
                  <span className="booking-slot__time">{new Date(item.start).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit", timeZone: group.timezone || undefined })}</span>
                  <span className="booking-slot__sub">{group.staffName}</span>
                </button>
              )))}
            </div>
          </div>
        </div>
      </div>
      {slot ? (
        <form className="booking-form" onSubmit={submit}>
          <label><span>{t("firstName")} *</span><input required value={form.firstName} onChange={(event) => setForm({ ...form, firstName: event.target.value })} /></label>
          <label><span>{t("lastName")} *</span><input required value={form.lastName} onChange={(event) => setForm({ ...form, lastName: event.target.value })} /></label>
          <label>
            <span>{t("email")} *</span>
            <input
              required
              type="email"
              value={user?.email || form.email}
              readOnly={Boolean(user?.email)}
              aria-readonly={Boolean(user?.email)}
              onChange={(event) => {
                if (user?.email) return;
                setForm({ ...form, email: event.target.value });
              }}
            />
          </label>
          <label><span>{t("phone")} *</span><input required value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></label>
          <label className="booking-form__terms">
            <input type="checkbox" checked={form.acceptTerms} onChange={(event) => setForm({ ...form, acceptTerms: event.target.checked })} required={catalog?.settings?.require_terms !== false} />
            <span>{t("terms")} {catalog?.policy?.text || ""}</span>
          </label>
          <button className="booking-form__submit" type="submit">{t("confirm")}</button>
        </form>
      ) : null}
    </div>
  );
}
