import { NextResponse } from "next/server";
import { verifyPassword } from "@/lib/auth/password";
import { createStaffSession, getStaffSession } from "@/lib/auth/session";
import { createMfaTicket, readMfaTicket, verifyTotp } from "@/lib/auth/totp";
import { decryptPhi } from "@/lib/crypto/phi";
import { query } from "@/lib/db";
import { requestMeta, toErrorResponse } from "@/lib/http";
import { checkRateLimit } from "@/lib/rate-limit/memory";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { email?: string; password?: string; ticket?: string; code?: string };
    const meta = requestMeta(req);
    const limit = checkRateLimit(`staff-login:${meta.ip || "unknown"}`, { limit: 8, windowMs: 15 * 60 * 1000 });
    if (!limit.allowed) return NextResponse.json({ error: "Demasiados intentos. Espera un momento." }, { status: 429 });

    if (body.ticket && body.code) {
      const userId = readMfaTicket(body.ticket);
      if (!userId) return NextResponse.json({ error: "El código expiró. Vuelve a entrar." }, { status: 401 });
      const row = await query<{ mfa_secret_enc: Buffer | null; is_active: boolean }>(
        `SELECT mfa_secret_enc, is_active FROM staff_users WHERE id = $1`,
        [userId]
      );
      const secret = decryptPhi(row.rows[0]?.mfa_secret_enc);
      if (!row.rows[0]?.is_active || !secret || !verifyTotp(secret, body.code)) {
        return NextResponse.json({ error: "Código incorrecto." }, { status: 401 });
      }
      await createStaffSession(userId, meta);
      return NextResponse.json({ ok: true });
    }

    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    const user = await query<{ id: string; password_hash: string; is_active: boolean; mfa_secret_enc: Buffer | null }>(
      `SELECT id, password_hash, is_active, mfa_secret_enc FROM staff_users WHERE email_normalized = $1`,
      [email]
    );
    const row = user.rows[0];
    if (!row || !row.is_active || !(await verifyPassword(password, row.password_hash))) {
      return NextResponse.json({ error: "Correo o contraseña incorrectos." }, { status: 401 });
    }
    if (row.mfa_secret_enc) {
      return NextResponse.json({ mfaRequired: true, ticket: createMfaTicket(row.id) });
    }
    await createStaffSession(row.id, meta);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function GET() {
  const session = await getStaffSession();
  return NextResponse.json({ authenticated: Boolean(session) });
}
