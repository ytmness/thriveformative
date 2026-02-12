"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import AnimatedSection from "@/components/AnimatedSection";

const WHATSAPP_LINK = "https://google.com";

/* ───────────────────────────────────────────
   Sección de citas (emulada)
   Muestra horarios disponibles y ocupados
   como ejemplo de cómo se vería el sistema.
   ─────────────────────────────────────────── */

const DEMO_SLOTS = [
  { time: "09:00", occupied: true },
  { time: "09:30", occupied: false },
  { time: "10:00", occupied: true },
  { time: "10:30", occupied: true },
  { time: "11:00", occupied: false },
  { time: "11:30", occupied: false },
  { time: "12:00", occupied: true },
  { time: "12:30", occupied: false },
  { time: "13:00", occupied: false },
  { time: "13:30", occupied: true },
  { time: "14:00", occupied: false },
  { time: "14:30", occupied: true },
  { time: "15:00", occupied: true },
];

export default function BookingSection() {
  const t = useTranslations("booking");

  return (
    <AnimatedSection>
      <section className="max-w-7xl mx-auto px-6 py-20 md:py-28">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-4"
        >
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl tracking-wide">
            {t("title")}
          </h2>
          <p className="text-base md:text-lg text-muted mt-3 max-w-2xl leading-relaxed">
            {t("subtitle")}
          </p>
          <p className="text-sm text-muted mt-2 opacity-80">
            {t("demoNote")}
          </p>
        </motion.div>

        <div className="mt-10 grid md:grid-cols-[1fr_1.2fr] gap-10 items-start">
          {/* Calendario emulado */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="bg-surface border border-theme rounded-2xl shadow-soft p-6"
          >
            <div className="text-sm text-muted tracking-[0.22em] mb-4">
              {t("dateLabel")}
            </div>
            <div className="flex items-center justify-between mb-6">
              <button
                type="button"
                className="w-10 h-10 rounded-xl border border-theme flex items-center justify-center text-muted hover:bg-[rgb(var(--primary)/0.08)] transition-colors"
                aria-label={t("prevMonth")}
              >
                ‹
              </button>
              <span className="font-display text-lg tracking-wide">
                {t("sampleDate")}
              </span>
              <button
                type="button"
                className="w-10 h-10 rounded-xl border border-theme flex items-center justify-center text-muted hover:bg-[rgb(var(--primary)/0.08)] transition-colors"
                aria-label={t("nextMonth")}
              >
                ›
              </button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-sm text-muted">
              {["L", "M", "X", "J", "V", "S", "D"].map((d) => (
                <div key={d} className="py-1">{d}</div>
              ))}
              {Array.from({ length: 35 }, (_, i) => {
                const day = i >= 4 ? i - 3 : 0;
                const isSelected = day === 15;
                const isInRange = day >= 1 && day <= 28;
                return (
                  <div
                    key={i}
                    className={`py-2 rounded-lg ${
                      isSelected
                        ? "bg-[rgb(var(--primary)/0.2)] text-[rgb(var(--primary))] font-medium"
                        : !isInRange || day === 0
                          ? "opacity-40"
                          : "hover:bg-[rgb(var(--primary)/0.08)] cursor-pointer"
                    }`}
                  >
                    {day > 0 ? day : ""}
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Horarios */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="text-sm text-muted tracking-[0.22em] mb-4">
              {t("slotsLabel")}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {DEMO_SLOTS.map((slot, i) => (
                <motion.button
                  key={slot.time}
                  type="button"
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: i * 0.02 }}
                  disabled={slot.occupied}
                  className={`rounded-xl px-4 py-3 text-sm font-medium text-left transition-all ${
                    slot.occupied
                      ? "bg-[rgb(var(--bg)/0.6)] border border-theme text-muted cursor-not-allowed opacity-70 line-through"
                      : "bg-surface border border-theme hover:border-[rgb(var(--primary)/0.4)] hover:bg-[rgb(var(--primary)/0.06)] cursor-pointer"
                  }`}
                >
                  <span className="block">{slot.time}</span>
                  {slot.occupied && (
                    <span className="block text-xs mt-0.5 opacity-80">
                      {t("occupied")}
                    </span>
                  )}
                </motion.button>
              ))}
            </div>
            <p className="mt-4 text-sm text-muted leading-relaxed border-t border-theme pt-4">
              {t("occupiedHint")}
            </p>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-10 text-center"
        >
          <p className="text-muted text-sm mb-3">{t("ctaHint")}</p>
          <a
            href={WHATSAPP_LINK}
            target="_blank"
            rel="noreferrer"
            className="btn-cta inline-block rounded-xl px-10 py-5 text-base tracking-wide shadow-lg"
          >
            {t("ctaButton")}
          </a>
        </motion.div>
      </section>
    </AnimatedSection>
  );
}
