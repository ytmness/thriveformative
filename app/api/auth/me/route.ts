import { currentPatient } from "@/lib/auth/patientAccess";

export async function GET() {
  const patient = await currentPatient().catch(() => null);
  if (!patient) return Response.json({ user: null });
  return Response.json({ user: { id: patient.id, email: patient.email, name: patient.name } });
}
