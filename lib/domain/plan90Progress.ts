import { query } from "@/lib/db";
import { DomainError } from "@/lib/http";
import { addDaysToDateKey, formatDate, locationTimezone, todayKey } from "@/lib/scheduling/time";

export type Plan90State = "pending" | "active" | "completed";

export type Plan90Progress = {
  state: Plan90State;
  startDate: string | null;
  endDate: string | null;
  dayNumber: number | null;
  totalDays: number;
  percent: number;
  timezone: string;
  completedOn: string | null;
};

const TOTAL_DAYS = 90;

function daysBetweenInclusive(startIso: string, endIso: string) {
  const start = new Date(`${startIso.slice(0, 10)}T12:00:00Z`);
  const end = new Date(`${endIso.slice(0, 10)}T12:00:00Z`);
  return Math.round((end.getTime() - start.getTime()) / 86400000) + 1;
}

export async function getPlan90Progress(patientId: string): Promise<Plan90Progress> {
  const meta = await query<{
    plan90_anchor_date: string | null;
    timezone: string | null;
    country: string | null;
  }>(
    `SELECT p.plan90_anchor_date::text AS plan90_anchor_date,
            l.timezone, coalesce(l.country, p.country) AS country
     FROM patients p
     LEFT JOIN locations l ON l.id = p.location_id
     WHERE p.id = $1`,
    [patientId]
  );
  const row = meta.rows[0];
  if (!row) throw new DomainError("Paciente no encontrado.", 404);
  const patientTz = locationTimezone(row.timezone, row.country);
  const anchor = row.plan90_anchor_date ? String(row.plan90_anchor_date).slice(0, 10) : null;

  const visits = await query<{ starts_at: string; timezone: string | null; country: string | null }>(
    `SELECT a.starts_at, l.timezone, l.country
     FROM appointments a
     LEFT JOIN locations l ON l.id = a.location_id
     WHERE a.patient_id = $1
       AND a.status = 'completed'
     ORDER BY a.starts_at ASC`,
    [patientId]
  );

  let startDate: string | null = null;
  let visitTz = patientTz;
  for (const visit of visits.rows) {
    const tz = locationTimezone(visit.timezone, visit.country || row.country);
    const localDay = formatDate(new Date(visit.starts_at), tz);
    if (anchor && localDay < anchor) continue;
    startDate = localDay;
    visitTz = tz;
    break;
  }

  if (!startDate) {
    return {
      state: "pending",
      startDate: null,
      endDate: null,
      dayNumber: null,
      totalDays: TOTAL_DAYS,
      percent: 0,
      timezone: patientTz,
      completedOn: null,
    };
  }

  const endDate = addDaysToDateKey(startDate, TOTAL_DAYS - 1);
  const today = todayKey(visitTz);
  const dayNumber = daysBetweenInclusive(startDate, today);
  if (dayNumber > TOTAL_DAYS || today > endDate) {
    return {
      state: "completed",
      startDate,
      endDate,
      dayNumber: TOTAL_DAYS,
      totalDays: TOTAL_DAYS,
      percent: 100,
      timezone: visitTz,
      completedOn: endDate,
    };
  }
  const currentDay = Math.max(1, dayNumber);
  return {
    state: "active",
    startDate,
    endDate,
    dayNumber: currentDay,
    totalDays: TOTAL_DAYS,
    percent: Math.min(100, Math.round((currentDay / TOTAL_DAYS) * 100)),
    timezone: visitTz,
    completedOn: null,
  };
}

export async function restartPlan90(patientId: string) {
  const meta = await query<{ timezone: string | null; country: string | null }>(
    `SELECT l.timezone, coalesce(l.country, p.country) AS country
     FROM patients p
     LEFT JOIN locations l ON l.id = p.location_id
     WHERE p.id = $1`,
    [patientId]
  );
  if (!meta.rows[0]) throw new DomainError("Paciente no encontrado.", 404);
  const timezone = locationTimezone(meta.rows[0].timezone, meta.rows[0].country);
  const today = todayKey(timezone);
  await query(`UPDATE patients SET plan90_anchor_date = $2::date, updated_at = now() WHERE id = $1`, [patientId, today]);
  return getPlan90Progress(patientId);
}
