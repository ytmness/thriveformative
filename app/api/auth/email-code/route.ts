import { sendPatientCode } from "@/lib/auth/patientAccess";
import { requestMeta, toErrorResponse } from "@/lib/http";
import { checkRateLimit } from "@/lib/rate-limit/memory";

export async function POST(req: Request) {
  const meta = requestMeta(req);
  const limit = checkRateLimit(`email-code:${meta.ip || "unknown"}`, { limit: 8, windowMs: 15 * 60 * 1000 });
  if (!limit.allowed) {
    return Response.json({ error: "Demasiados intentos. Espera unos minutos y vuelve a intentarlo." }, { status: 429 });
  }
  try {
    const body = (await req.json().catch(() => null)) as { email?: string; locale?: string; purpose?: string } | null;
    const purpose = body?.purpose === "register" ? "register" : "login";
    await sendPatientCode({ email: String(body?.email || ""), locale: body?.locale, purpose });
    return Response.json({ ok: true });
  } catch (error) {
    return toErrorResponse(error);
  }
}
