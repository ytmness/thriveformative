/** Deprecated — booking config lived in Supabase; calendar of record is Pabau. */
export type BookingSettings = {
  timezone: string;
  slot_duration_minutes: number;
  buffer_minutes: number;
  open_time: string;
  close_time: string;
  days_open: number[];
};

export async function fetchBookingSettings(): Promise<BookingSettings | null> {
  return null;
}
