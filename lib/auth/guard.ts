import { NextResponse } from "next/server";
import { getStaffSession, hasPermission, type StaffSession } from "@/lib/auth/session";

export function isSession(value: StaffSession | NextResponse): value is StaffSession {
  return !(value instanceof NextResponse);
}

export async function requireStaff(): Promise<StaffSession | NextResponse> {
  const session = await getStaffSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  return session;
}

export async function requirePermission(key: string): Promise<StaffSession | NextResponse> {
  const session = await requireStaff();
  if (!isSession(session)) return session;
  if (!hasPermission(session, key)) {
    return NextResponse.json({ error: "Sin permiso para esta acción" }, { status: 403 });
  }
  return session;
}
