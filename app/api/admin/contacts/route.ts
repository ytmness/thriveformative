import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/adminSession";
import { query } from "@/lib/db";

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  try {
    const res = await query(
      `SELECT id, name, email, subject, message, read_at, created_at
       FROM contact_requests ORDER BY created_at DESC`
    );
    return NextResponse.json({ contacts: res.rows });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Error" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  try {
    const body = (await req.json()) as { id?: string };
    if (!body.id) {
      return NextResponse.json({ error: "id requerido" }, { status: 400 });
    }
    await query(`UPDATE contact_requests SET read_at = now() WHERE id = $1`, [body.id]);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Error" },
      { status: 500 }
    );
  }
}
