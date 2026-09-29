import CalendarBoard from "@/components/admin/calendar/CalendarBoard";

export default async function CalendarPage({ searchParams }: { searchParams: Promise<{ nueva?: string }> }) {
  const query = await searchParams;
  return <CalendarBoard openCreate={query.nueva === "1"} />;
}
