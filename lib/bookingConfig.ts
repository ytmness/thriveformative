import { createClient } from "@/lib/supabase";
import type { BlockedDateRow, BookingSettings, WeeklyHoursRow } from "@/lib/bookingAvailability";
import { mergeSettings } from "@/lib/bookingAvailability";

export type BookingConfig = {
  settings: BookingSettings;
  weeklyHours: WeeklyHoursRow[];
  blockedDates: BlockedDateRow[];
};

export async function fetchBookingConfig(): Promise<BookingConfig> {
  const supabase = createClient();

  const [settingsRes, weeklyRes, blockedRes] = await Promise.all([
    supabase
      .from("booking_settings")
      .select("slot_duration_minutes, min_advance_days, max_advance_days")
      .eq("id", 1)
      .maybeSingle(),
    supabase
      .from("booking_weekly_hours")
      .select("day_of_week, is_enabled, start_time, end_time")
      .order("day_of_week"),
    supabase
      .from("booking_blocked_dates")
      .select("id, blocked_date, reason")
      .order("blocked_date"),
  ]);

  return {
    settings: mergeSettings(settingsRes.data as BookingSettings | null),
    weeklyHours: (weeklyRes.data ?? []) as WeeklyHoursRow[],
    blockedDates: (blockedRes.data ?? []) as BlockedDateRow[],
  };
}
