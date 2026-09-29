import { NextResponse } from "next/server";
import { getPortalSession, portalAppointments, portalInvoices } from "@/lib/auth/portal";
import { query } from "@/lib/db";

export async function GET() {
  const session = await getPortalSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const [appointments, invoices, forms] = await Promise.all([
    portalAppointments(session.patientId),
    portalInvoices(session.patientId),
    query(
      `SELECT a.id, a.status, a.due_at, t.name, t.form_type
       FROM form_assignments a JOIN form_templates t ON t.id = a.template_id
       WHERE a.patient_id = $1 ORDER BY a.created_at DESC`,
      [session.patientId]
    ),
  ]);
  return Response.json({ patient: session, appointments, invoices, forms: forms.rows });
}
