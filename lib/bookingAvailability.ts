/** Configuración global de citas (tabla booking_settings, fila id=1). */
export type BookingSettings = {
  slot_duration_minutes: number;
  min_advance_days: number;
  max_advance_days: number;
};

/** Horario semanal (0=domingo … 6=sábado, como Date.getDay()). */
export type WeeklyHoursRow = {
  day_of_week: number;
  is_enabled: boolean;
  start_time: string;
  end_time: string;
};

export type BlockedDateRow = {
  id: string;
  blocked_date: string;
  reason: string | null;
};

export const DAY_LABELS_ES = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
] as const;

const DEFAULT_SETTINGS: BookingSettings = {
  slot_duration_minutes: 30,
  min_advance_days: 1,
  max_advance_days: 90,
};

export function parseTimeToMinutes(time: string): number {
  const part = time.trim().slice(0, 5);
  const [h, m] = part.split(":").map((x) => parseInt(x, 10));
  return (h || 0) * 60 + (m || 0);
}

export function formatMinutes(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** Normaliza "09:00:00" → "09:00". */
export function normalizeTimeSlot(time: string): string {
  return formatMinutes(parseTimeToMinutes(time));
}

export function generateTimeSlotsForDay(
  weekly: WeeklyHoursRow | undefined,
  settings: BookingSettings
): string[] {
  if (!weekly?.is_enabled) return [];
  const start = parseTimeToMinutes(weekly.start_time);
  const end = parseTimeToMinutes(weekly.end_time);
  const dur = settings.slot_duration_minutes;
  if (dur <= 0 || end <= start) return [];

  const slots: string[] = [];
  for (let t = start; t + dur <= end; t += dur) {
    slots.push(formatMinutes(t));
  }
  return slots;
}

export function dateKeyFromParts(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function dateKeyFromDate(d: Date): string {
  return dateKeyFromParts(d.getFullYear(), d.getMonth(), d.getDate());
}

function startOfLocalDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function getMinBookableDate(settings: BookingSettings, today = new Date()): Date {
  const t = startOfLocalDay(today);
  t.setDate(t.getDate() + settings.min_advance_days);
  return t;
}

export function getMaxBookableDate(settings: BookingSettings, today = new Date()): Date {
  const t = startOfLocalDay(today);
  t.setDate(t.getDate() + settings.max_advance_days);
  return t;
}

export function buildWeeklyMap(rows: WeeklyHoursRow[]): Map<number, WeeklyHoursRow> {
  const map = new Map<number, WeeklyHoursRow>();
  rows.forEach((r) => map.set(r.day_of_week, r));
  return map;
}

export function buildBlockedSet(rows: { blocked_date: string }[]): Set<string> {
  return new Set(rows.map((r) => r.blocked_date));
}

export function isDateBookable(
  year: number,
  month: number,
  day: number,
  settings: BookingSettings,
  weeklyByDow: Map<number, WeeklyHoursRow>,
  blockedSet: Set<string>,
  today = new Date()
): boolean {
  const key = dateKeyFromParts(year, month, day);
  if (blockedSet.has(key)) return false;

  const cell = startOfLocalDay(new Date(year, month, day));
  const min = getMinBookableDate(settings, today);
  const max = getMaxBookableDate(settings, today);
  if (cell.getTime() < min.getTime() || cell.getTime() > max.getTime()) return false;

  const dow = cell.getDay();
  const weekly = weeklyByDow.get(dow);
  return generateTimeSlotsForDay(weekly, settings).length > 0;
}

export function slotsForDateKey(
  dateKey: string,
  settings: BookingSettings,
  weeklyByDow: Map<number, WeeklyHoursRow>,
  blockedSet: Set<string>
): string[] {
  if (blockedSet.has(dateKey)) return [];
  const [y, mo, d] = dateKey.split("-").map((n) => parseInt(n, 10));
  const cell = new Date(y, mo - 1, d);
  const dow = cell.getDay();
  return generateTimeSlotsForDay(weeklyByDow.get(dow), settings);
}

export function mergeSettings(row: BookingSettings | null | undefined): BookingSettings {
  if (!row) return { ...DEFAULT_SETTINGS };
  return {
    slot_duration_minutes: row.slot_duration_minutes ?? DEFAULT_SETTINGS.slot_duration_minutes,
    min_advance_days: row.min_advance_days ?? DEFAULT_SETTINGS.min_advance_days,
    max_advance_days: row.max_advance_days ?? DEFAULT_SETTINGS.max_advance_days,
  };
}
