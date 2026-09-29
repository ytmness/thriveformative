import { PatientList } from "@/components/admin/patients/PatientScreens";

export default async function PatientsPage({ searchParams }: { searchParams: Promise<{ nuevo?: string }> }) {
  const query = await searchParams;
  return <PatientList startNew={query.nuevo === "1"} />;
}
