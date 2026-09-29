import { PatientList } from "@/components/admin/patients/PatientScreens";

export default async function PatientsPage({ searchParams }: { searchParams: Promise<{ nuevo?: string; q?: string; archivado?: string }> }) {
  const query = await searchParams;
  return <PatientList startNew={query.nuevo === "1"} initialQuery={query.q || ""} initialNotice={query.archivado === "1" ? "Paciente archivado. El expediente se conserva." : null} />;
}
