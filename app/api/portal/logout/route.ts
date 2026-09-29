import { NextResponse } from "next/server";
import { clearPortalSession } from "@/lib/auth/portal";

export async function POST() {
  await clearPortalSession();
  return NextResponse.json({ ok: true });
}
