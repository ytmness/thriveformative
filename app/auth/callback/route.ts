import { NextResponse } from "next/server";
import { PABAU_BOOKING_URL } from "@/lib/pabau";

/** Legacy Supabase OAuth callback — redirect patients to Pabau booking portal. */
export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const next = requestUrl.searchParams.get("next");
  if (next?.startsWith("/") && !next.startsWith("//")) {
    return NextResponse.redirect(new URL(next, requestUrl.origin));
  }
  return NextResponse.redirect(PABAU_BOOKING_URL);
}
