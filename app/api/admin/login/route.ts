import { NextResponse } from "next/server";
import {
  checkAdminPassword,
  clearAdminSessionCookie,
  isAdminAuthenticated,
  setAdminSessionCookie,
} from "@/lib/adminSession";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { password?: string };
    if (!checkAdminPassword(String(body.password ?? ""))) {
      return NextResponse.json({ error: "Contraseña incorrecta" }, { status: 401 });
    }
    await setAdminSessionCookie();
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  const ok = await isAdminAuthenticated();
  return NextResponse.json({ authenticated: ok });
}
