"use client";



import { useState, useEffect, useMemo } from "react";

import Link from "next/link";

import { useLocale } from "next-intl";

import { useTranslations } from "next-intl";

import AnimatedSection from "@/components/AnimatedSection";

import { useCmsContext } from "@/components/cms/CmsProvider";

import { resolveCmsText } from "@/lib/cms/fetch";

import { useUser } from "@/lib/useUser";

import { createClient } from "@/lib/supabase";

import BrandCtaLink from "@/components/ui/BrandCtaLink";
import { WHATSAPP_LINK } from "@/lib/branding";

import { fetchBookingConfig } from "@/lib/bookingConfig";

import {

  buildBlockedSet,

  buildWeeklyMap,

  dateKeyFromDate,

  getMinBookableDate,

  isDateBookable,

  mergeSettings,

  normalizeTimeSlot,

  slotsForDateKey,

  type BookingSettings,

} from "@/lib/bookingAvailability";



const MONTHS_ES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];



const WEEKDAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;



export default function BookingSection() {

  const t = useTranslations("booking");

  const tAuth = useTranslations("auth");

  const locale = useLocale();

  const { textOverrides } = useCmsContext();

  const { user, loading } = useUser();

  const bookingTitle = resolveCmsText(textOverrides, "booking.title", t("title"));

  const bookingSubtitle = resolveCmsText(textOverrides, "booking.subtitle", t("subtitle"));

  const bookingCtaHint = resolveCmsText(textOverrides, "booking.ctaHint", t("ctaHint"));

  const bookingCtaButton = resolveCmsText(textOverrides, "booking.ctaButton", t("ctaButton"));



  const [bookingSettings, setBookingSettings] = useState<BookingSettings>(() =>

    mergeSettings(null)

  );

  const [weeklyByDow, setWeeklyByDow] = useState(() => buildWeeklyMap([]));

  const [blockedSet, setBlockedSet] = useState(() => new Set<string>());

  const [configLoading, setConfigLoading] = useState(true);



  const [currentMonth, setCurrentMonth] = useState(() => {

    const min = getMinBookableDate(mergeSettings(null));

    return { year: min.getFullYear(), month: min.getMonth() };

  });

  const [selectedDate, setSelectedDate] = useState<Date>(() =>

    getMinBookableDate(mergeSettings(null))

  );

  const [appointments, setAppointments] = useState<{ appointment_date: string; time_slot: string }[]>([]);

  const [bookingSlot, setBookingSlot] = useState<string | null>(null);

  const [bookingError, setBookingError] = useState<string | null>(null);



  const selectedDateKey = dateKeyFromDate(selectedDate);



  useEffect(() => {

    let cancelled = false;

    setConfigLoading(true);

    fetchBookingConfig()

      .then((cfg) => {

        if (cancelled) return;

        setBookingSettings(cfg.settings);

        setWeeklyByDow(buildWeeklyMap(cfg.weeklyHours));

        setBlockedSet(buildBlockedSet(cfg.blockedDates));

        const min = getMinBookableDate(cfg.settings);

        setCurrentMonth({ year: min.getFullYear(), month: min.getMonth() });

        setSelectedDate(min);

      })

      .catch(() => {

        if (!cancelled) {

          setBookingSettings(mergeSettings(null));

        }

      })

      .finally(() => {

        if (!cancelled) setConfigLoading(false);

      });

    return () => {

      cancelled = true;

    };

  }, []);



  useEffect(() => {

    if (!user) {

      setAppointments([]);

      return;

    }

    const supabase = createClient();

    supabase

      .from("appointments")

      .select("appointment_date, time_slot")

      .eq("appointment_date", selectedDateKey)

      .neq("status", "cancelled")

      .then(({ data }) => {

        setAppointments(data ?? []);

      });

  }, [user, selectedDateKey]);



  const occupiedSet = useMemo(() => {

    const set = new Set<string>();

    appointments.forEach((a) => set.add(normalizeTimeSlot(a.time_slot)));

    return set;

  }, [appointments]);



  const timeSlots = useMemo(

    () => slotsForDateKey(selectedDateKey, bookingSettings, weeklyByDow, blockedSet),

    [selectedDateKey, bookingSettings, weeklyByDow, blockedSet]

  );



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

    if (

      !isDateBookable(

        currentMonth.year,

        currentMonth.month,

        day,

        bookingSettings,

        weeklyByDow,

        blockedSet

      )

    ) {

      return;

    }

    setSelectedDate(new Date(currentMonth.year, currentMonth.month, day));

  }



  function isDayBookable(day: number) {

    return isDateBookable(

      currentMonth.year,

      currentMonth.month,

      day,

      bookingSettings,

      weeklyByDow,

      blockedSet

    );

  }



  async function bookSlot(timeSlot: string) {

    if (!user) return;

    const minKey = dateKeyFromDate(getMinBookableDate(bookingSettings));

    if (selectedDateKey < minKey) {

      setBookingError(t("sameDayNotAllowed"));

      return;

    }

    if (!timeSlots.includes(timeSlot)) {

      setBookingError(t("slotUnavailable"));

      return;

    }

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

    if (user.email) {

      fetch("/api/send-email", {

        method: "POST",

        headers: { "Content-Type": "application/json" },

        body: JSON.stringify({

          kind: "appointment_pending",

          to: user.email,

          date: selectedDateKey,

          timeSlot,

        }),

      }).catch(() => {});

    }

  }



  const sectionBusy = loading || configLoading;



  if (sectionBusy) {

    return (

      <AnimatedSection>

        <section className="booking-section max-w-screen-2xl mx-auto px-4 sm:px-6 py-20 md:py-28">

          <div className="animate-pulse h-64 max-w-md mx-auto bg-surface rounded-2xl border border-theme" />

        </section>

      </AnimatedSection>

    );

  }



  if (!user) {

    return (

      <AnimatedSection>

        <section className="booking-section max-w-screen-2xl mx-auto px-4 sm:px-6 py-20 md:py-28">

          <header className="booking-section__header">

            <h2 className="booking-section__title">{bookingTitle}</h2>

            <p className="booking-section__subtitle">{bookingSubtitle}</p>

          </header>

          <div className="mt-10 max-w-xl mx-auto w-full">

            <div className="rounded-2xl border border-theme bg-surface shadow-soft overflow-hidden">

              <div className="border-l-4 border-[rgb(var(--primary))] p-8 md:p-10">

                <div className="flex items-center justify-center sm:justify-start gap-3 mb-6">

                  <span className="flex items-center justify-center w-12 h-12 rounded-xl bg-[rgb(var(--primary)/0.12)] text-[rgb(var(--primary))]" aria-hidden>

                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">

                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>

                      <line x1="16" y1="2" x2="16" y2="6"/>

                      <line x1="8" y1="2" x2="8" y2="6"/>

                      <line x1="3" y1="10" x2="21" y2="10"/>

                    </svg>

                  </span>

                  <span className="type-overline-tight font-semibold tracking-[0.2em]">

                    {t("loginCardLabel")}

                  </span>

                </div>

                <p className="type-prose-muted mb-8 text-center sm:text-left">

                  {t("loginPrompt")}

                </p>

                <div className="flex flex-wrap gap-4 justify-center">

                  <Link

                    href={`/${locale}/login`}

                    className="btn-primary type-btn rounded-xl px-8 py-4 min-w-[10rem] text-center"

                  >

                    {tAuth("submitLogin")}

                  </Link>

                  <Link

                    href={`/${locale}/register`}

                    className="btn-outline type-btn rounded-xl px-8 py-4 min-w-[10rem] text-center border-theme hover:bg-[rgb(var(--primary)/0.08)]"

                  >

                    {tAuth("submitRegister")}

                  </Link>

                </div>

                <div className="mt-8 pt-8 border-t border-theme text-center">

                  <p className="booking-section__cta-hint booking-section__cta-hint--inline">

                    {bookingCtaHint}

                  </p>

                  <BrandCtaLink
                    href={WHATSAPP_LINK}
                    target="_blank"
                    rel="noreferrer"
                    className="booking-section__whatsapp-btn"
                  >
                    {bookingCtaButton}
                  </BrandCtaLink>

                </div>

              </div>

            </div>

          </div>

        </section>

      </AnimatedSection>

    );

  }



  return (

    <AnimatedSection>

      <section className="booking-section max-w-screen-2xl mx-auto px-4 sm:px-6 py-20 md:py-28">

        <header className="booking-section__header">

          <h2 className="booking-section__title">{bookingTitle}</h2>

          <p className="booking-section__subtitle">{bookingSubtitle}</p>

        </header>



        <div className="booking-section__layout">

          <div className="booking-cal-wrap">

            <div className="booking-cal">

              <div className="booking-cal__shell">

                <p className="booking-cal__label">{t("dateLabel")}</p>

                <div className="booking-cal__nav">

                  <button

                    type="button"

                    onClick={prevMonth}

                    className="booking-cal__nav-btn"

                    aria-label={t("prevMonth")}

                  >

                    ‹

                  </button>

                  <span className="booking-cal__month">{monthLabel}</span>

                  <button

                    type="button"

                    onClick={nextMonth}

                    className="booking-cal__nav-btn"

                    aria-label={t("nextMonth")}

                  >

                    ›

                  </button>

                </div>

                <div className="booking-cal__dow" role="row">

                  {WEEKDAY_KEYS.map((key) => (

                    <div key={key} className="booking-cal__dow-cell" role="columnheader">

                      {t(`weekday.${key}`)}

                    </div>

                  ))}

                </div>

                <div className="booking-cal__grid" role="grid">

                  {calendarDays.map((day, i) => {

                    const isPad = day === null;

                    const bookable = !isPad && isDayBookable(day);

                    const isSelected =

                      !isPad &&

                      selectedDate.getDate() === day &&

                      selectedDate.getMonth() === currentMonth.month &&

                      selectedDate.getFullYear() === currentMonth.year;

                    return (

                      <button

                        key={i}

                        type="button"

                        onClick={() => selectDay(day)}

                        disabled={isPad || !bookable}

                        className={`booking-cal__day${isPad ? " booking-cal__day--pad" : ""}${!isPad && !bookable ? " booking-cal__day--blocked" : ""}${isSelected ? " booking-cal__day--selected" : ""}`}

                      >

                        {day ?? ""}

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

              {bookingError && (

                <div className="booking-error" role="alert">

                  {bookingError}

                </div>

              )}

              {timeSlots.length === 0 ? (

                <p className="booking-slots__empty">{t("noSlotsThisDay")}</p>

              ) : (

                <div className="booking-slots__grid">

                  {timeSlots.map((timeSlot) => {

                    const occupied = occupiedSet.has(timeSlot);

                    const isBooking = bookingSlot === timeSlot;

                    const busy = occupied || isBooking;

                    return (

                      <button

                        key={timeSlot}

                        type="button"

                        disabled={busy}

                        onClick={() => bookSlot(timeSlot)}

                        className={`booking-slot${busy ? " booking-slot--busy" : ""}`}

                      >

                        <span className="booking-slot__time">{timeSlot}</span>

                        <span className="booking-slot__sub">

                          {occupied

                            ? t("occupied")

                            : isBooking && !occupied

                              ? t("bookingInProgress")

                              : ""}

                        </span>

                      </button>

                    );

                  })}

                </div>

              )}

              <p className="booking-slots__hint">{t("occupiedHint")}</p>

            </div>

          </div>

        </div>



        <div className="booking-section__cta">

          <p className="booking-section__cta-hint">{bookingCtaHint}</p>

          <BrandCtaLink
            href={WHATSAPP_LINK}
            target="_blank"
            rel="noreferrer"
            className="booking-section__whatsapp-btn"
          >
            {bookingCtaButton}
          </BrandCtaLink>

        </div>

      </section>

    </AnimatedSection>

  );

}


