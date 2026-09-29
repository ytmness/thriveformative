import { PatientChart } from "@/components/admin/patients/PatientScreens";

export default async function PatientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PatientChart id={id} tab="resumen" />;
}
