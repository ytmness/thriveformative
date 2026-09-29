import { NextResponse } from "next/server";
import { portalLogin } from "@/lib/auth/portal";
import { readJson, requestMeta, toErrorResponse } from "@/lib/http";
import { checkRateLimit } from "@/lib/rate-limit/memory";

export async function POST(req: Request) {
  const meta = requestMeta(req);
  const limit = checkRateLimit(`portal:${meta.ip || "unknown"}`, { limit: 8, windowMs: 15 * 60 * 1000 });
  if (!limit.allowed) return NextResponse.json({ error: "Demasiados intentos." }, { status: 429 });
  try {
    const body = await readJson(req);
    await portalLogin(String(body.email || ""), String(body.password || ""), meta);
    return Response.json({ ok: true });
  } catch (error) {
    return toErrorResponse(error);
  }
}
