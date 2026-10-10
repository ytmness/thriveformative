import { currentPatient } from "@/lib/auth/patientAccess";
import { portalInvoices } from "@/lib/auth/portal";
import { query } from "@/lib/db";

function currencyOf(country: string | null) {
  const value = (country || "").toUpperCase();
  return value === "US" || value === "USA" || value === "UNITED STATES" || value === "ESTADOS UNIDOS" ? "USD" : "MXN";
}

type OrderRow = {
  id: string;
  kind: "cita" | "consulta" | "online";
  title: string;
  detail: string;
  status: string;
  at: string;
  amount: number | null;
  currency: string | null;
  minor: boolean;
  receiptUrl: string | null;
};

export async function GET() {
  const patient = await currentPatient().catch(() => null);
  if (!patient) return Response.json({ error: "Inicia sesión para ver tu cuenta." }, { status: 401 });
  const [visits, consultations, online, invoices] = await Promise.all([
    query<{
      id: string;
      starts_at: string;
      status: string;
      service_name: string | null;
      price: string | null;
      location_name: string | null;
      country: string | null;
      first_name: string | null;
      last_name: string | null;
    }>(
      `SELECT a.id, a.starts_at, a.status, s.name AS service_name, s.price::text, l.name AS location_name, l.country,
              u.first_name, u.last_name
       FROM appointments a
       LEFT JOIN services s ON s.id = a.service_id
       LEFT JOIN locations l ON l.id = a.location_id
       LEFT JOIN staff_users u ON u.id = a.staff_user_id
       WHERE a.patient_id = $1
       ORDER BY a.starts_at DESC
       LIMIT 40`,
      [patient.id]
    ),
    query<{ id: string; status: string; total: string; created_at: string; title: string | null; location_name: string | null; country: string | null }>(
      `SELECT s.id, s.status, s.total::text, s.created_at, l.name AS location_name, l.country,
              (SELECT string_agg(si.description, ' · ' ORDER BY si.description)
               FROM sale_items si WHERE si.sale_id = s.id AND si.item_type = 'service') AS title
       FROM sales s
       LEFT JOIN locations l ON l.id = s.location_id
       WHERE s.patient_id = $1 AND s.status <> 'void'
         AND EXISTS (SELECT 1 FROM sale_items si WHERE si.sale_id = s.id AND si.item_type = 'service')
       ORDER BY s.created_at DESC
       LIMIT 40`,
      [patient.id]
    ),
    patient.email
      ? query<{ id: string; status: string; fulfillment: string; currency: string; total_amount: number; created_at: string; receipt_url: string | null }>(
          `SELECT id, status, fulfillment, currency, total_amount, created_at, receipt_url
           FROM store_orders
           WHERE lower(recipient_email) = lower($1)
           ORDER BY created_at DESC
           LIMIT 40`,
          [patient.email]
        )
      : Promise.resolve({ rows: [] as { id: string; status: string; fulfillment: string; currency: string; total_amount: number; created_at: string; receipt_url: string | null }[] }),
    portalInvoices(patient.id),
  ]);

  const orders: OrderRow[] = [
    ...visits.rows.map((row) => ({
      id: `cita:${row.id}`,
      kind: "cita" as const,
      title: row.service_name || "Cita",
      detail: [ [row.first_name, row.last_name].filter(Boolean).join(" "), row.location_name ].filter(Boolean).join(" · "),
      status: row.status,
      at: row.starts_at,
      amount: row.price == null ? null : Number(row.price),
      currency: currencyOf(row.country),
      minor: false,
      receiptUrl: null,
    })),
    ...consultations.rows.map((row) => ({
      id: `consulta:${row.id}`,
      kind: "consulta" as const,
      title: row.title || "Consulta",
      detail: row.location_name || "Clínica",
      status: row.status,
      at: row.created_at,
      amount: Number(row.total || 0),
      currency: currencyOf(row.country),
      minor: false,
      receiptUrl: null,
    })),
    ...online.rows.map((row) => ({
      id: `online:${row.id}`,
      kind: "online" as const,
      title: row.fulfillment === "shipping" ? "Pedido con envío" : "Pedido para recoger",
      detail: "Tienda en línea",
      status: row.status,
      at: row.created_at,
      amount: Number(row.total_amount || 0),
      currency: row.currency || "USD",
      minor: true,
      receiptUrl: row.receipt_url,
    })),
  ].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

  return Response.json({
    patient: { name: patient.name, email: patient.email },
    orders,
    invoices,
  });
}
