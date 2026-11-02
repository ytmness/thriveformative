import { NextResponse } from "next/server";
import { contactHash } from "@/lib/crypto/phi";
import { query } from "@/lib/db";
import { log } from "@/lib/log";

const STOP = new Set(["stop", "unsubscribe", "cancel", "end", "quit", "alto", "baja"]);
const START = new Set(["start", "yes", "unstop", "alta"]);

export async function POST(req: Request) {
  const form = await req.formData().catch(() => null);
  const from = String(form?.get("From") || "").replace(/^whatsapp:/i, "").trim();
  const body = String(form?.get("Body") || "").trim().toLowerCase();
  if (!from || !body) return NextResponse.json({ ok: true });
  const hash = contactHash("phone", from);
  if (!hash) return NextResponse.json({ ok: true });
  const keyword = body.split(/\s+/)[0] || "";
  if (STOP.has(keyword)) {
    await query(`UPDATE patients SET sms_opt_out = true, consent_sms = false WHERE mobile_hash = $1`, [hash]);
    log.info("messages", "opt-out SMS", { action: "stop" });
  } else if (START.has(keyword)) {
    await query(`UPDATE patients SET sms_opt_out = false, consent_sms = true WHERE mobile_hash = $1`, [hash]);
    log.info("messages", "opt-in SMS", { action: "start" });
  }
  return NextResponse.json({ ok: true });
}
