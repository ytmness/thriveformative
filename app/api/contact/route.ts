import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      name?: string;
      email?: string;
      subject?: string | null;
      message?: string;
      website?: string;
    };
    // honeypot
    if (body.website) {
      return NextResponse.json({ ok: true });
    }
    const name = String(body.name ?? "").trim();
    const email = String(body.email ?? "").trim();
    const message = String(body.message ?? "").trim();
    const subject = body.subject ? String(body.subject).trim() : null;
    if (!name || !email || !message) {
      return NextResponse.json({ error: "Campos requeridos" }, { status: 400 });
    }
    await query(
      `INSERT INTO contact_requests (name, email, subject, message)
       VALUES ($1, $2, $3, $4)`,
      [name, email, subject, message]
    );
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Error" },
      { status: 500 }
    );
  }
}
