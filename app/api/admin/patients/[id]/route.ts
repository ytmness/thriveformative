import { isSession, requirePermission } from "@/lib/auth/guard";
import { archivePatient, getPatient, updatePatient, type PatientInput } from "@/lib/domain/patients";
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

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await requirePermission("patients.read");
  if (!isSession(session)) return session;
  try {
    const { id } = await ctx.params;
    return Response.json({ patient: await getPatient(id, session, requestMeta(req)) });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await requirePermission("patients.write");
  if (!isSession(session)) return session;
  try {
    const { id } = await ctx.params;
    return Response.json({ patient: await updatePatient(id, inputOf(await readJson(req)), session, requestMeta(req)) });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await requirePermission("patients.write");
  if (!isSession(session)) return session;
  try {
    const { id } = await ctx.params;
    await archivePatient(id, session);
    return Response.json({ ok: true });
  } catch (error) {
    return toErrorResponse(error);
  }
}
