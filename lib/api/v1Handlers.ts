import { createHash } from "crypto";
import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { createPatient, listPatients } from "@/lib/domain/patients";
import { createAppointment, listAppointments } from "@/lib/domain/appointments";
import { listLeads, saveLead } from "@/lib/domain/leads";
import { createSale, listSales } from "@/lib/domain/sales";
import { readJson, requestMeta, toErrorResponse } from "@/lib/http";
import type { StaffSession } from "@/lib/auth/session";

async function auth(req: Request, scope: string) {
  const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (!token) return null;
  const hash = createHash("sha256").update(token).digest("hex");
  const row = await query<{ id: string; scopes: string[]; created_by: string | null }>(
    `SELECT id, scopes, created_by FROM api_keys WHERE key_hash = $1 AND revoked_at IS NULL`,
    [hash]
  );
  const key = row.rows[0];
  if (!key || (!key.scopes.includes(scope) && !key.scopes.includes("*"))) return null;
  await query(`UPDATE api_keys SET last_used_at = now() WHERE id = $1`, [key.id]);
  const actor: StaffSession = {
    sessionId: key.id,
    permissions: key.scopes,
    staff: {
      id: key.created_by || "",
      email: "api",
      firstName: "API",
      lastName: "Key",
      jobTitle: null,
      calendarColor: "#d4a473",
      isBookable: false,
      roles: ["api"],
    },
  };
  return actor;
}

function denied() {
  return NextResponse.json({ error: "API key inválida o sin alcance." }, { status: 401 });
}

export async function patientsGET(req: Request) {
  const actor = await auth(req, "patients.read");
  if (!actor) return denied();
  return Response.json(await listPatients(new URL(req.url)));
}

export async function patientsPOST(req: Request) {
  const actor = await auth(req, "patients.write");
  if (!actor) return denied();
  try {
    const body = await readJson(req);
    const patient = await createPatient(
      {
        firstName: String(body.firstName || ""),
        lastName: String(body.lastName || ""),
        email: (body.email as string) || null,
        mobile: (body.mobile as string) || null,
        phone: (body.phone as string) || null,
      },
      actor,
      requestMeta(req)
    );
    return Response.json({ patient });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function appointmentsGET(req: Request) {
  const actor = await auth(req, "appointments.read");
  if (!actor) return denied();
  const url = new URL(req.url);
  const rows = await listAppointments(url.searchParams.get("from") || new Date().toISOString(), url.searchParams.get("to") || new Date(Date.now() + 7 * 86400000).toISOString(), {});
  return Response.json({ rows });
}

export async function appointmentsPOST(req: Request) {
  const actor = await auth(req, "appointments.write");
  if (!actor) return denied();
  try {
    return Response.json(await createAppointment((await readJson(req)) as never, actor, requestMeta(req)));
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function leadsGET(req: Request) {
  const actor = await auth(req, "leads.read");
  if (!actor) return denied();
  return Response.json({ rows: await listLeads() });
}

export async function leadsPOST(req: Request) {
  const actor = await auth(req, "leads.write");
  if (!actor) return denied();
  try {
    return Response.json(await saveLead(null, await readJson(req), actor));
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function salesGET(req: Request) {
  const actor = await auth(req, "sales.read");
  if (!actor) return denied();
  return Response.json(await listSales(new URL(req.url)));
}

export async function salesPOST(req: Request) {
  const actor = await auth(req, "sales.write");
  if (!actor) return denied();
  try {
    return Response.json(await createSale((await readJson(req)) as never, actor));
  } catch (error) {
    return toErrorResponse(error);
  }
}
