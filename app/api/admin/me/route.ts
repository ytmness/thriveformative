import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/adminSession";

export async function GET() {
  return NextResponse.json({ authenticated: await isAdminAuthenticated() });
}
