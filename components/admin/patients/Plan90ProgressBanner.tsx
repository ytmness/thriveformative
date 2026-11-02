"use client";

import type { Plan90Progress } from "@/lib/domain/plan90Progress";

function formatDay(iso: string | null | undefined, english: boolean) {
  if (!iso) return "—";
  return new Date(`${iso.slice(0, 10)}T12:00:00`).toLocaleDateString(english ? "en-US" : "es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function Plan90ProgressBanner({
  progress,
  english = false,
  onRestart,
  restarting = false,
}: {
  progress?: Plan90Progress | null;
  english?: boolean;
  onRestart?: () => void;
  restarting?: boolean;
}) {
  if (!progress) return null;
  if (progress.state === "pending") {
    return (
      <div className="plan90-banner plan90-banner--pending" role="status">
        {english ? "The 90-day plan starts with the first completed visit." : "El plan de 90 días inicia con la primera cita"}
      </div>
    );
  }
  if (progress.state === "completed") {
    return (
      <div className="plan90-banner plan90-banner--done" role="status">
        <div>
          {english
            ? `Plan completed on ${formatDay(progress.completedOn || progress.endDate, true)}`
            : `Plan completado el ${formatDay(progress.completedOn || progress.endDate, false)}`}
        </div>
        {onRestart ? (
          <button className="admin-btn admin-btn--primary" type="button" disabled={restarting} onClick={onRestart}>
            {english ? "Start new plan" : "Iniciar nuevo plan"}
          </button>
        ) : null}
      </div>
    );
  }
  return (
    <div className="plan90-banner" role="status">
      <div className="plan90-banner__copy">
        {english
          ? `Start: ${formatDay(progress.startDate, true)} · Day ${progress.dayNumber} of ${progress.totalDays} · Ends: ${formatDay(progress.endDate, true)}`
          : `Inicio: ${formatDay(progress.startDate, false)} · Día ${progress.dayNumber} de ${progress.totalDays} · Termina: ${formatDay(progress.endDate, false)}`}
      </div>
      <div className="plan90-banner__track" aria-hidden="true">
        <div className="plan90-banner__fill" style={{ width: `${progress.percent}%` }} />
      </div>
    </div>
  );
}

export function Plan90Chip({ progress, english = false }: { progress?: Plan90Progress | null; english?: boolean }) {
  if (!progress) return null;
  const label =
    progress.state === "pending"
      ? english
        ? "90d plan · Not started"
        : "Plan 90d · Por iniciar"
      : progress.state === "completed"
        ? english
          ? "90d plan · Done"
          : "Plan 90d · Completado"
        : english
          ? `90d plan · Day ${progress.dayNumber}`
          : `Plan 90d · Día ${progress.dayNumber}`;
  return <span className={`plan90-chip plan90-chip--${progress.state}`}>{label}</span>;
}
