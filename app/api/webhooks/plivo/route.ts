import { NextResponse } from "next/server";
import { applySmsKeyword } from "@/lib/messaging/optOut";
import { verifyPlivoSignature } from "@/lib/messaging/verify";
import { log } from "@/lib/log";
import { getSiteUrl } from "@/lib/env/server";

export async function POST(req: Request) {
  const raw = await req.text();
  const url = `${getSiteUrl()}/api/webhooks/plivo`;
  if (!verifyPlivoSignature(raw, req.headers, url)) {
    log.warn("messages", "webhook Plivo rechazado", { reason: "firma" });
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  let from = "";
  let text = "";
  try {
    const json = raw ? JSON.parse(raw) : {};
    from = String(json.From || json.from || json.src || "");
    text = String(json.Text || json.text || json.body || "");
  } catch {
    const form = new URLSearchParams(raw);
    from = String(form.get("From") || form.get("from") || form.get("src") || "");
    text = String(form.get("Text") || form.get("text") || form.get("Body") || "");
  }
  await applySmsKeyword(from, text);
  return NextResponse.json({ ok: true });
}
