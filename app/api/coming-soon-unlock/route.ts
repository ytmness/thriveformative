import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = "thrive_unlock";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 año

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const password = typeof body?.password === "string" ? body.password : "";

    const expected = process.env.COMING_SOON_PASSWORD;
    if (!expected) {
      console.warn("[coming-soon-unlock] COMING_SOON_PASSWORD no está configurado.");
      return NextResponse.json(
        { ok: false, error: "Acceso no configurado" },
        { status: 500 }
      );
    }

    if (password !== expected) {
      return NextResponse.json(
        { ok: false, error: "Contraseña incorrecta" },
        { status: 401 }
      );
    }

    const res = NextResponse.json({ ok: true });
    res.cookies.set(COOKIE_NAME, "1", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: COOKIE_MAX_AGE,
    });
    return res;
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
