import { verifyPatientCode, type RegisterProfile } from "@/lib/auth/patientAccess";
import { requestMeta, toErrorResponse } from "@/lib/http";
import { checkRateLimit } from "@/lib/rate-limit/memory";
import { visitorMarket } from "@/lib/site/detect";

export async function POST(req: Request) {
  const meta = requestMeta(req);
  const limit = checkRateLimit(`verify-code:${meta.ip || "unknown"}`, { limit: 12, windowMs: 15 * 60 * 1000 });
  if (!limit.allowed) {
    return Response.json({ error: "Demasiados intentos. Espera unos minutos y vuelve a intentarlo." }, { status: 429 });
  }
  try {
    const body = (await req.json().catch(() => null)) as {
      email?: string;
      code?: string;
      purpose?: string;
      profile?: RegisterProfile;
    } | null;
    const purpose = body?.purpose === "register" ? "register" : "login";
    const market = purpose === "register" ? await visitorMarket(req) : null;
    await verifyPatientCode({
      email: String(body?.email || ""),
      code: String(body?.code || ""),
      purpose,
      profile: body?.profile,
      market,
      meta,
    });
    return Response.json({ ok: true });
  } catch (error) {
    return toErrorResponse(error);
  }
}
