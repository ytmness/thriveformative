import { NextResponse } from "next/server";
import { requireStaff, isSession } from "@/lib/auth/guard";

export async function GET() {
  const session = await requireStaff();
  if (!isSession(session)) return session;
  return NextResponse.json({ staff: session.staff, permissions: session.permissions });
}
