"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { api } from "@/components/admin/clinic/client";

type Slot = { start: string; end: string };
type Group = { staffUserId: string; timezone?: string; slots: Slot[] };
type Visit = {
  serviceName: string;
  staffName: string;
  locationName: string;
  timezone?: string;
  startsAt: string;
  endsAt: string;
  status: string;
  serviceId: string;
  locationId: string;
  staffUserId: string;
};

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function dateKey(year: number, month: number, day: number) {
  return `${year}-${pad(month + 1)}-${pad(day)}`;
}

const STATUS: Record<string, string> = {
  booked: "Reservada",
  confirmed: "Confirmada",
  arrived: "Llegó",
  completed: "Completada",
  cancelled: "Cancelada",
  no_show: "No asistió",
};

export default function ManageBooking({ token }: { token: string }) {
  const t = useTranslations("booking");
  const locale = useLocale();
  const [visit, setVisit] = useState<Visit | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const [selected, setSelected] = useState("");
  const [groups, setGroups] = useState<Group[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  useEffect(() => {
    api<{ appointment: Visit }>(`/api/public/booking?token=${encodeURIComponent(token)}`)
      .then((result) => setVisit(result.appointment))
      .catch((error) => setMessage(error instanceof Error ? error.message : "No se encontró la cita."));
  }, [token]);

  useEffect(() => {
    if (!visit || !selected || visit.status === "cancelled") return;
    setLoadingSlots(true);
    const params = new URLSearchParams({
      serviceId: visit.serviceId,
      date: selected,
      locationId: visit.locationId,
      staffUserId: visit.staffUserId,
    });
    api<{ slots: Group[] }>(`/api/public/booking/availability?${params}`)
      .then((result) => setGroups(result.slots))
      .catch(() => setGroups([]))
      .finally(() => setLoadingSlots(false));
  }, [visit, selected]);

  const cells = useMemo(() => {
    const first = new Date(cursor.year, cursor.month, 1);
    const padCount = (first.getDay() + 6) % 7;
    const count = new Date(cursor.year, cursor.month + 1, 0).getDate();
    const next: (number | null)[] = Array.from({ length: padCount }, () => null);
    for (let day = 1; day <= count; day += 1) next.push(day);
    while (next.length % 7) next.push(null);
    return next;
  }, [cursor]);

  if (!visit) {
    return <p className="booking-slots__empty">{message || "Cargando la cita…"}</p>;
  }

  const zone = visit.timezone || groups[0]?.timezone;
  const when = new Date(visit.startsAt).toLocaleString(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: zone || undefined,
  });
  const closed = visit.status === "cancelled" || visit.status === "completed";
  const today = new Date();
  const todayKey = dateKey(today.getFullYear(), today.getMonth(), today.getDate());
  const monthLabel = new Date(cursor.year, cursor.month, 1).toLocaleDateString(locale, { month: "long", year: "numeric" });

  async function cancel() {
    if (!window.confirm("¿Cancelar esta cita?")) return;
    setBusy(true);
    setMessage(null);
    try {
      await api("/api/public/booking", { method: "PUT", body: JSON.stringify({ token, action: "cancel" }) });
      setVisit({ ...visit!, status: "cancelled" });
      setMessage("La cita quedó cancelada.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo cancelar.");
    } finally {
      setBusy(false);
    }
  }

  async function move(slot: Slot) {
    setBusy(true);
    setMessage(null);
    try {
      await api("/api/public/booking", {
        method: "PUT",
        body: JSON.stringify({ token, action: "reschedule", startsAt: slot.start, endsAt: slot.end }),
      });
      setVisit({ ...visit!, startsAt: slot.start, endsAt: slot.end, status: "booked" });
      setMessage("La cita quedó en el nuevo horario.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo reprogramar.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className="visit-sheet">
      <p className="visit-sheet__eyebrow">Thrive Formative</p>
      <h1 className="type-page-title">{visit.serviceName || "Tu cita"}</h1>
      <p className="visit-sheet__when">{when}</p>
      <dl className="visit-sheet__facts">
        <div><dt>Profesional</dt><dd>{visit.staffName || "Por asignar"}</dd></div>
        <div><dt>Sede</dt><dd>{visit.locationName || "Clínica"}</dd></div>
        <div><dt>Estado</dt><dd>{STATUS[visit.status] || visit.status}</dd></div>
      </dl>
      {message ? <p className="booking-error" role="status">{message}</p> : null}
      {closed ? null : (
        <>
          <button className="booking-form__submit visit-sheet__cancel" type="button" disabled={busy} onClick={() => void cancel()}>
            Cancelar cita
          </button>
          <section className="visit-sheet__move">
            <h2>Cambiar horario</h2>
            <p>Solo aparecen los horarios que la clínica tiene abiertos para este profesional.</p>
            <div className="booking-cal">
              <div className="booking-cal__nav">
                <button type="button" className="booking-cal__nav-btn" aria-label="Mes anterior" onClick={() => setCursor((current) => {
                  const month = current.month - 1;
                  return month < 0 ? { year: current.year - 1, month: 11 } : { year: current.year, month };
                })}>‹</button>
                <span className="booking-cal__month">{monthLabel}</span>
                <button type="button" className="booking-cal__nav-btn" aria-label="Mes siguiente" onClick={() => setCursor((current) => {
                  const month = current.month + 1;
                  return month > 11 ? { year: current.year + 1, month: 0 } : { year: current.year, month };
                })}>›</button>
              </div>
              <div className="booking-cal__dow">
                {t("dow").split(",").map((name) => <div key={name} className="booking-cal__dow-cell">{name}</div>)}
              </div>
              <div className="booking-cal__grid">
                {cells.map((day, index) => {
                  if (!day) return <button key={`pad-${index}`} type="button" className="booking-cal__day booking-cal__day--pad" disabled />;
                  const key = dateKey(cursor.year, cursor.month, day);
                  const bookable = key >= todayKey;
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
            <div className="booking-slots__grid">
              {!selected ? <p className="booking-slots__empty">{t("pickDay")}</p> : null}
              {selected && loadingSlots ? <p className="booking-slots__empty">Buscando horarios…</p> : null}
              {selected && !loadingSlots && !groups.some((group) => group.slots.length) ? <p className="booking-slots__empty">{t("noSlots")}</p> : null}
              {groups.flatMap((group) => group.slots.map((slot) => (
                <button key={slot.start} type="button" className="booking-slot" disabled={busy} onClick={() => void move(slot)}>
                  <span className="booking-slot__time">
                    {new Date(slot.start).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit", timeZone: group.timezone || zone || undefined })}
                  </span>
                </button>
              )))}
            </div>
          </section>
        </>
      )}
    </article>
  );
}
