import { query } from "@/lib/db";
import { addDaysToDateKey, todayKey, weekdayIndex, zonedTimeToUtc } from "@/lib/scheduling/time";

type Range = { start: number; end: number; staffId?: string | null; roomId?: string | null; locationId?: string | null };

function overlaps(a0: number, a1: number, b0: number, b1: number) {
  return a0 < b1 && b0 < a1;
}

export type Slot = { start: string; end: string; roomId: string | null };

export async function availabilityForDate(input: {
  serviceId: string;
  date: string;
  locationId?: string | null;
  staffUserId?: string | null;
}) {
  const service = await query<{
    id: string;
    duration_minutes: number;
    buffer_before_minutes: number;
    buffer_after_minutes: number;
    is_online_bookable: boolean;
    is_active: boolean;
  }>(
    `SELECT id, duration_minutes, buffer_before_minutes, buffer_after_minutes, is_online_bookable, is_active
     FROM services WHERE id = $1`,
    [input.serviceId]
  );
  const svc = service.rows[0];
  if (!svc || !svc.is_active) return [];

  const settings = await query<{
    slot_interval_minutes: number;
    min_advance_hours: number;
    max_advance_days: number;
  }>(`SELECT slot_interval_minutes, min_advance_hours, max_advance_days FROM booking_settings WHERE id = 1`);
  const cfg = settings.rows[0] ?? {
    slot_interval_minutes: 15,
    min_advance_hours: 2,
    max_advance_days: 90,
  };

  const staffRes = await query<{
    id: string;
    first_name: string;
    last_name: string;
    calendar_color: string;
  }>(
    `SELECT u.id, u.first_name, u.last_name, u.calendar_color
     FROM staff_users u
     WHERE u.is_active AND u.is_bookable
       AND ($1::uuid IS NULL OR u.id = $1)
       AND (
         NOT EXISTS (SELECT 1 FROM service_staff ss WHERE ss.service_id = $2)
         OR EXISTS (SELECT 1 FROM service_staff ss WHERE ss.service_id = $2 AND ss.staff_user_id = u.id)
       )`,
    [input.staffUserId ?? null, input.serviceId]
  );

  const locations = await query<{ id: string; timezone: string; name: string }>(
    `SELECT l.id, l.timezone, l.name FROM locations l
     WHERE l.is_active
       AND ($1::uuid IS NULL OR l.id = $1)
       AND (
         NOT EXISTS (SELECT 1 FROM service_locations sl WHERE sl.service_id = $2)
         OR EXISTS (SELECT 1 FROM service_locations sl WHERE sl.service_id = $2 AND sl.location_id = l.id)
       )`,
    [input.locationId ?? null, input.serviceId]
  );

  const rooms = await query<{ id: string; location_id: string }>(
    `SELECT r.id, r.location_id
     FROM rooms r
     WHERE r.is_active
       AND (
         NOT EXISTS (SELECT 1 FROM service_rooms sr WHERE sr.service_id = $1)
         OR EXISTS (SELECT 1 FROM service_rooms sr WHERE sr.service_id = $1 AND sr.room_id = r.id)
       )`,
    [input.serviceId]
  );
  const requiresRoom = (
    await query<{ n: number }>(`SELECT count(*)::int AS n FROM service_rooms WHERE service_id = $1`, [input.serviceId])
  ).rows[0].n > 0;

  const dayStart = zonedTimeToUtc(input.date, "00:00", locations.rows[0]?.timezone || "America/Chicago");
  const dayEnd = new Date(dayStart.getTime() + 36 * 60 * 60 * 1000);
  const appts = await query<{ staff_user_id: string; room_id: string | null; starts_at: string; ends_at: string }>(
    `SELECT staff_user_id, room_id, starts_at, ends_at FROM appointments
     WHERE status NOT IN ('cancelled', 'no_show') AND starts_at < $2 AND ends_at > $1`,
    [dayStart.toISOString(), dayEnd.toISOString()]
  );
  const blocks = await query<{
    staff_user_id: string | null;
    room_id: string | null;
    location_id: string | null;
    starts_at: string;
    ends_at: string;
    all_day: boolean;
  }>(
    `SELECT staff_user_id, room_id, location_id, starts_at, ends_at, all_day FROM bookouts
     WHERE starts_at < $2 AND ends_at > $1`,
    [dayStart.toISOString(), dayEnd.toISOString()]
  );

  const busy: Range[] = [
    ...appts.rows.map((row) => ({
      start: new Date(row.starts_at).getTime(),
      end: new Date(row.ends_at).getTime(),
      staffId: row.staff_user_id,
      roomId: row.room_id,
    })),
    ...blocks.rows.map((row) => ({
      start: new Date(row.starts_at).getTime(),
      end: new Date(row.ends_at).getTime(),
      staffId: row.staff_user_id,
      roomId: row.room_id,
      locationId: row.location_id,
    })),
  ];

  const now = Date.now();
  const result: {
    staffUserId: string;
    staffName: string;
    color: string;
    locationId: string;
    locationName: string;
    slots: Slot[];
  }[] = [];

  for (const location of locations.rows) {
    const today = todayKey(location.timezone);
    const maxDay = addDaysToDateKey(today, cfg.max_advance_days);
    if (input.date > maxDay) continue;
    const dow = weekdayIndex(input.date, location.timezone);
    const minStart = now + cfg.min_advance_hours * 60 * 60 * 1000;

    for (const staff of staffRes.rows) {
      const schedules = await query<{ start_time: string; end_time: string }>(
        `SELECT start_time::text, end_time::text FROM staff_schedules
         WHERE staff_user_id = $1 AND location_id = $2 AND day_of_week = $3
           AND (valid_from IS NULL OR valid_from <= $4::date)
           AND (valid_to IS NULL OR valid_to >= $4::date)`,
        [staff.id, location.id, dow, input.date]
      );
      const slots: Slot[] = [];
      for (const schedule of schedules.rows) {
        const open = zonedTimeToUtc(input.date, schedule.start_time.slice(0, 5), location.timezone).getTime();
        const close = zonedTimeToUtc(input.date, schedule.end_time.slice(0, 5), location.timezone).getTime();
        const step = cfg.slot_interval_minutes * 60000;
        const duration = svc.duration_minutes * 60000;
        const before = svc.buffer_before_minutes * 60000;
        const after = svc.buffer_after_minutes * 60000;
        for (let t = open; t + duration <= close; t += step) {
          if (t < minStart) continue;
          const windowStart = t - before;
          const windowEnd = t + duration + after;
          const blocked = busy.some((range) => {
            if (!overlaps(windowStart, windowEnd, range.start, range.end)) return false;
            if (range.staffId === staff.id) return true;
            return !range.staffId && range.locationId === location.id;
          });
          if (blocked) continue;
          const locationRooms = rooms.rows.filter((room) => room.location_id === location.id);
          const free = locationRooms.find(
            (room) =>
              !busy.some((range) => range.roomId === room.id && overlaps(t, t + duration, range.start, range.end))
          );
          if (requiresRoom && !free) continue;
          const roomId = free?.id ?? null;
          slots.push({
            start: new Date(t).toISOString(),
            end: new Date(t + duration).toISOString(),
            roomId,
          });
        }
      }
      if (slots.length) {
        result.push({
          staffUserId: staff.id,
          staffName: `${staff.first_name} ${staff.last_name}`,
          color: staff.calendar_color,
          locationId: location.id,
          locationName: location.name,
          slots,
        });
      }
    }
  }
  return result;
}
