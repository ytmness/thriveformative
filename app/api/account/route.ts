import { currentPatient } from "@/lib/auth/patientAccess";
import { portalAppointments, portalInvoices } from "@/lib/auth/portal";
import { query } from "@/lib/db";

export async function GET() {
  const patient = await currentPatient().catch(() => null);
  if (!patient) return Response.json({ error: "Inicia sesión para ver tu cuenta." }, { status: 401 });
  const [appointments, invoices, orders] = await Promise.all([
    portalAppointments(patient.id),
    portalInvoices(patient.id),
    patient.email
      ? query(
          `SELECT id, status, fulfillment, currency, total_amount, created_at, receipt_url
           FROM store_orders
           WHERE lower(recipient_email) = lower($1)
           ORDER BY created_at DESC
           LIMIT 30`,
          [patient.email]
        )
      : Promise.resolve({ rows: [] }),
  ]);
  return Response.json({
    patient: { name: patient.name, email: patient.email },
    appointments,
    invoices,
    orders: orders.rows,
  });
}
