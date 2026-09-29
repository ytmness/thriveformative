import { NextResponse } from "next/server";

/** Callback legado: los pacientes entran al portal propio. */
export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const next = requestUrl.searchParams.get("next");
  if (next?.startsWith("/") && !next.startsWith("//")) {
    return NextResponse.redirect(new URL(next, requestUrl.origin));
  }
  return NextResponse.redirect(new URL("/portal/login", requestUrl.origin));
}
