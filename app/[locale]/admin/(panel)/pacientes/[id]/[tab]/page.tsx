import { PatientChart } from "@/components/admin/patients/PatientScreens";

export default async function PatientTabPage({ params }: { params: Promise<{ id: string; tab: string }> }) {
  const { id, tab } = await params;
  return <PatientChart id={id} tab={tab} />;
}
