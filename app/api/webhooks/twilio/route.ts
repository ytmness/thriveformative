import { NextResponse } from "next/server";
import { applySmsKeyword } from "@/lib/messaging/optOut";
import { verifyTwilioSignature } from "@/lib/messaging/verify";
import { log } from "@/lib/log";
import { getSiteUrl } from "@/lib/env/server";

export async function POST(req: Request) {
  const raw = await req.text();
  const url = `${getSiteUrl()}/api/webhooks/twilio`;
  if (!verifyTwilioSignature(raw, req.headers, url)) {
    log.warn("messages", "webhook Twilio rechazado", { reason: "firma" });
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const form = new URLSearchParams(raw);
  const from = String(form.get("From") || "");
  const body = String(form.get("Body") || "");
  await applySmsKeyword(from, body);
  return NextResponse.json({ ok: true });
}
