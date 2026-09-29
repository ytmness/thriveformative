import LeadBoard from "@/components/admin/leads/LeadBoard";
export default async function Page({ searchParams }: { searchParams: Promise<{ nuevo?: string }> }) {
  const query = await searchParams;
  return <LeadBoard startNew={query.nuevo === "1"} />;
}
