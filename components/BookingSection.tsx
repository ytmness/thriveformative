"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import AnimatedSection from "@/components/AnimatedSection";
import { useScrollDirection } from "@/lib/useScrollDirection";
import { LATERAL } from "@/lib/lateralAnimation";
import { useUser } from "@/lib/useUser";
import { createClient } from "@/lib/supabase";

const WHATSAPP_LINK = "https://google.com";

const TIME_SLOTS = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
  "15:00", "15:30", "16:00", "16:30", "17:00", "17:30",
];

const MONTHS_ES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

function formatDateKey(d: Date) {
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}

export default function BookingSection() {
  const t = useTranslations("booking");
  const tAuth = useTranslations("auth");
  const locale = useLocale();
  const scrollDirection = useScrollDirection();
  const fromY = scrollDirection === "down" ? LATERAL.fromY : -LATERAL.fromY;
  const { user, loading } = useUser();

  const [currentMonth, setCurrentMonth] = useState(() => {
    const n = new Date();
    return { year: n.getFullYear(), month: n.getMonth() };
  });
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [appointments, setAppointments] = useState<{ appointment_date: string; time_slot: string }[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [bookingSlot, setBookingSlot] = useState<string | null>(null);
  const [bookingError, setBookingError] = useState<string | null>(null);

  const selectedDateKey = selectedDate ? formatDateKey(selectedDate) : null;

  useEffect(() => {
    if (!user || !selectedDateKey) {
      setAppointments([]);
      return;
    }
    setLoadingSlots(true);
    const supabase = createClient();
    supabase
      .from("appointments")
      .select("appointment_date, time_slot")
      .eq("appointment_date", selectedDateKey)
      .neq("status", "cancelled")
      .then(({ data }) => {
        setAppointments(data ?? []);
        setLoadingSlots(false);
      });
  }, [user, selectedDateKey]);

  const occupiedSet = useMemo(() => {
    const set = new Set<string>();
    appointments.forEach((a) => set.add(a.time_slot));
    return set;
  }, [appointments]);

  const calendarDays = useMemo(() => {
    const { year, month } = currentMonth;
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    const startPad = first.getDay() === 0 ? 6 : first.getDay() - 1;
    const days: (number | null)[] = Array(startPad).fill(null);
    for (let d = 1; d <= last.getDate(); d++) days.push(d);
    return days;
  }, [currentMonth]);

  const monthLabel = MONTHS_ES[currentMonth.month] + " " + currentMonth.year;

  function prevMonth() {
    setCurrentMonth((m) => (m.month === 0 ? { year: m.year - 1, month: 11 } : { year: m.year, month: m.month - 1 }));
  }

  function nextMonth() {
    setCurrentMonth((m) => (m.month === 11 ? { year: m.year + 1, month: 0 } : { year: m.year, month: m.month + 1 }));
  }

  function selectDay(day: number | null) {
    if (day === null) return;
    setSelectedDate(new Date(currentMonth.year, currentMonth.month, day));
  }

  async function bookSlot(timeSlot: string) {
    if (!user || !selectedDateKey) return;
    setBookingError(null);
    setBookingSlot(timeSlot);
    const supabase = createClient();
    const { error } = await supabase.from("appointments").insert({
      user_id: user.id,
      appointment_date: selectedDateKey,
      time_slot: timeSlot,
      type: "inicial",
      status: "pending",
    });
    setBookingSlot(null);
    if (error) {
      setBookingError(error.message);
      return;
    }
    setAppointments((prev) => [...prev, { appointment_date: selectedDateKey, time_slot: timeSlot }]);
  }

  if (loading) {
    return (
      <AnimatedSection>
        <section className="max-w-7xl mx-auto px-6 py-20 md:py-28">
          <div className="animate-pulse h-64 bg-surface rounded-2xl border border-theme" />
        </section>
      </AnimatedSection>
    );
  }

  if (!user) {
    return (
      <AnimatedSection>
        <section className="max-w-7xl mx-auto px-6 py-20 md:py-28">
          <motion.div
            initial={{ opacity: 0, y: fromY }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.02 }}
            transition={{ duration: LATERAL.durationFlower, ease: LATERAL.ease }}
            className="mb-4"
          >
            <h2 className="font-display text-4xl md:text-5xl lg:text-6xl tracking-wide">
              {t("title")}
            </h2>
            <p className="text-lg md:text-xl text-muted mt-3 max-w-2xl leading-relaxed">
              {t("subtitle")}
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: fromY }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.02 }}
            transition={{ duration: LATERAL.durationBranch, delay: 0.1, ease: LATERAL.ease }}
            className="mt-10 max-w-xl mx-auto"
          >
            <div className="rounded-2xl border border-theme bg-surface shadow-soft overflow-hidden">
              <div className="border-l-4 border-[rgb(var(--primary))] p-8 md:p-10">
                <div className="flex items-center gap-3 mb-6">
                  <span className="flex items-center justify-center w-12 h-12 rounded-xl bg-[rgb(var(--primary)/0.12)] text-[rgb(var(--primary))]" aria-hidden>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                      <line x1="16" y1="2" x2="16" y2="6"/>
                      <line x1="8" y1="2" x2="8" y2="6"/>
                      <line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                  </span>
                  <span className="text-sm font-medium tracking-[0.2em] uppercase text-muted">
                    {t("loginCardLabel")}
                  </span>
                </div>
                <p className="text-lg text-muted leading-relaxed mb-8">
                  {t("loginPrompt")}
                </p>
                <div className="flex flex-wrap gap-4 justify-center sm:justify-start">
                  <Link
                    href={`/${locale}/login`}
                    className="btn-primary rounded-xl px-8 py-4 text-base font-medium min-w-[10rem] text-center"
                  >
                    {tAuth("submitLogin")}
                  </Link>
                  <Link
                    href={`/${locale}/register`}
                    className="btn-outline rounded-xl px-8 py-4 text-base font-medium min-w-[10rem] text-center border-theme hover:bg-[rgb(var(--primary)/0.08)]"
                  >
                    {tAuth("submitRegister")}
                  </Link>
                </div>
                <div className="mt-8 pt-8 border-t border-theme">
                  <p className="text-muted text-sm mb-3">
                    {t("ctaHint")}
                  </p>
                  <a
                    href={WHATSAPP_LINK}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-cta inline-block rounded-xl px-8 py-4 text-base font-medium"
                  >
                    {t("ctaButton")}
                  </a>
                </div>
              </div>
            </div>
          </motion.div>
        </section>
      </AnimatedSection>
    );
  }

  return (
    <AnimatedSection>
      <section className="max-w-7xl mx-auto px-6 py-20 md:py-28">
        <motion.div
          initial={{ opacity: 0, y: fromY }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.02 }}
          transition={{ duration: LATERAL.durationFlower, ease: LATERAL.ease }}
          className="mb-4"
        >
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl tracking-wide">
            {t("title")}
          </h2>
          <p className="text-lg md:text-xl text-muted mt-3 max-w-2xl leading-relaxed">
            Elige fecha y horario disponible para tu consulta.
          </p>
        </motion.div>

        <div className="mt-10 grid md:grid-cols-[1fr_1.2fr] gap-10 items-start">
          {/* Calendario */}
          <motion.div
            initial={{ opacity: 0, x: -LATERAL.fromY }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: false, amount: 0.02 }}
            transition={{ duration: LATERAL.durationBranch, ease: LATERAL.ease }}
            className="bg-surface border border-theme rounded-2xl shadow-soft p-6"
          >
            <div className="text-base text-muted tracking-[0.22em] mb-4">
              {t("dateLabel")}
            </div>
            <div className="flex items-center justify-between mb-6">
              <button
                type="button"
                onClick={prevMonth}
                className="w-11 h-11 rounded-xl border border-theme flex items-center justify-center text-muted hover:bg-[rgb(var(--primary)/0.08)] transition-colors text-lg"
                aria-label={t("prevMonth")}
              >
                ‹
              </button>
              <span className="font-display text-xl tracking-wide">
                {monthLabel}
              </span>
              <button
                type="button"
                onClick={nextMonth}
                className="w-11 h-11 rounded-xl border border-theme flex items-center justify-center text-muted hover:bg-[rgb(var(--primary)/0.08)] transition-colors text-lg"
                aria-label={t("nextMonth")}
              >
                ›
              </button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-base text-muted">
              {["L", "M", "X", "J", "V", "S", "D"].map((d) => (
                <div key={d} className="py-1">{d}</div>
              ))}
              {calendarDays.map((day, i) => {
                const isSelected =
                  selectedDate &&
                  day !== null &&
                  selectedDate.getDate() === day &&
                  selectedDate.getMonth() === currentMonth.month &&
                  selectedDate.getFullYear() === currentMonth.year;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => selectDay(day)}
                    disabled={day === null}
                    className={`py-2 rounded-lg text-base ${
                      isSelected
                        ? "bg-[rgb(var(--primary)/0.2)] text-[rgb(var(--primary))] font-medium"
                        : day === null
                          ? "opacity-0 cursor-default"
                          : "hover:bg-[rgb(var(--primary)/0.08)] cursor-pointer"
                    }`}
                  >
                    {day ?? ""}
                  </button>
                );
              })}
            </div>
          </motion.div>

          {/* Horarios */}
          <motion.div
            initial={{ opacity: 0, x: LATERAL.fromY }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: false, amount: 0.02 }}
            transition={{ duration: LATERAL.durationBranch, ease: LATERAL.ease }}
          >
            <div className="text-base text-muted tracking-[0.22em] mb-4">
              {t("slotsLabel")}
            </div>
            {!selectedDate ? (
              <p className="text-muted">Elige una fecha en el calendario.</p>
            ) : (
              <>
                {bookingError && (
                  <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 text-sm">
                    {bookingError}
                  </div>
                )}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {TIME_SLOTS.map((timeSlot) => {
                    const occupied = occupiedSet.has(timeSlot);
                    const isBooking = bookingSlot === timeSlot;
                    return (
                      <motion.button
                        key={timeSlot}
                        type="button"
                        disabled={occupied || isBooking}
                        onClick={() => bookSlot(timeSlot)}
                        className={`rounded-xl px-4 py-3 text-base font-medium text-left transition-all ${
                          occupied || isBooking
                            ? "bg-[rgb(var(--bg)/0.6)] border border-theme text-muted cursor-not-allowed opacity-70 line-through"
                            : "bg-surface border border-theme hover:border-[rgb(var(--primary)/0.4)] hover:bg-[rgb(var(--primary)/0.06)] cursor-pointer"
                        }`}
                      >
                        <span className="block">{timeSlot}</span>
                        {occupied && (
                          <span className="block text-sm mt-0.5 opacity-80">
                            {t("occupied")}
                          </span>
                        )}
                        {isBooking && (
                          <span className="block text-sm mt-0.5 opacity-80">
                            Reservando…
                          </span>
                        )}
                      </motion.button>
                    );
                  })}
                </div>
                <p className="mt-4 text-base text-muted leading-relaxed border-t border-theme pt-4">
                  {t("occupiedHint")}
                </p>
              </>
            )}
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: fromY }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.02 }}
          transition={{ duration: LATERAL.durationBranch, delay: 0.2, ease: LATERAL.ease }}
          className="mt-10 text-center"
        >
          <p className="text-muted text-base mb-3">{t("ctaHint")}</p>
          <a
            href={WHATSAPP_LINK}
            target="_blank"
            rel="noreferrer"
            className="btn-cta inline-block rounded-xl px-10 py-5 text-lg tracking-wide shadow-lg"
          >
            {t("ctaButton")}
          </a>
        </motion.div>
      </section>
    </AnimatedSection>
  );
}
