import { isSession, requirePermission } from "@/lib/auth/guard";
import { createPatient, listPatients, type PatientInput } from "@/lib/domain/patients";
import { readJson, requestMeta, toErrorResponse } from "@/lib/http";

function inputOf(body: Record<string, unknown>): PatientInput {
  return {
    locationId: (body.locationId as string) || null,
    ownerStaffId: (body.ownerStaffId as string) || null,
    salutation: (body.salutation as string) || null,
    firstName: String(body.firstName || ""),
    lastName: String(body.lastName || ""),
    sex: (body.sex as string) || null,
    birthDate: (body.birthDate as string) || null,
    preferredLanguage: (body.preferredLanguage as string) || "es",
    marketingSourceId: (body.marketingSourceId as string) || null,
    referredByName: (body.referredByName as string) || null,
    email: (body.email as string) || null,
    mobile: (body.mobile as string) || null,
    phone: (body.phone as string) || null,
    street: (body.street as string) || null,
    city: (body.city as string) || null,
    state: (body.state as string) || null,
    country: (body.country as string) || null,
    postalCode: (body.postalCode as string) || null,
    consentSms: Boolean(body.consentSms),
    consentEmail: Boolean(body.consentEmail),
    consentPhone: Boolean(body.consentPhone),
    consentPostal: Boolean(body.consentPostal),
    privacyPolicyStatus: (body.privacyPolicyStatus as string) || "sin_respuesta",
    tagIds: Array.isArray(body.tagIds) ? body.tagIds.map(String) : [],
    customFields: Array.isArray(body.customFields) ? (body.customFields as { fieldId: string; value: unknown }[]) : [],
  };
}

export async function GET(req: Request) {
  const session = await requirePermission("patients.read");
  if (!isSession(session)) return session;
  try {
    return Response.json(await listPatients(new URL(req.url)));
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function POST(req: Request) {
  const session = await requirePermission("patients.write");
  if (!isSession(session)) return session;
  try {
    const patient = await createPatient(inputOf(await readJson(req)), session, requestMeta(req));
    return Response.json({ patient });
  } catch (error) {
    return toErrorResponse(error);
  }
}
