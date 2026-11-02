"use client";

import { useLocale, useTranslations } from "next-intl";
import type { Plan90Progress } from "@/lib/domain/plan90Progress";

function formatDay(iso: string | null | undefined, locale: string) {
  if (!iso) return "—";
  return new Date(`${iso.slice(0, 10)}T12:00:00`).toLocaleDateString(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function Plan90ProgressCard({ progress }: { progress?: Plan90Progress | null }) {
  const t = useTranslations("account");
  const locale = useLocale();
  if (!progress) return null;

  if (progress.state === "pending") {
    return (
      <section className="plan90-card plan90-card--pending" id="plan90">
        <h2>{t("plan90Title")}</h2>
        <p>{t("plan90Pending")}</p>
      </section>
    );
  }

  if (progress.state === "completed") {
    return (
      <section className="plan90-card plan90-card--done" id="plan90">
        <h2>{t("plan90Title")}</h2>
        <p>{t("plan90Completed", { date: formatDay(progress.completedOn || progress.endDate, locale) })}</p>
      </section>
    );
  }

  return (
    <section className="plan90-card" id="plan90">
      <h2>{t("plan90Title")}</h2>
      <p>{t("plan90Active", { day: progress.dayNumber ?? 1, total: progress.totalDays })}</p>
      <p className="plan90-card__meta">
        {t("plan90Range", {
          start: formatDay(progress.startDate, locale),
          end: formatDay(progress.endDate, locale),
        })}
      </p>
      <div className="plan90-banner__track" aria-hidden="true">
        <div className="plan90-banner__fill" style={{ width: `${progress.percent}%` }} />
      </div>
    </section>
  );
}
