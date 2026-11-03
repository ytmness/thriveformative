import { contactHash } from "@/lib/crypto/phi";
import { query } from "@/lib/db";
import { log } from "@/lib/log";

const STOP = new Set(["stop", "unsubscribe", "cancel", "end", "quit", "alto", "baja"]);
const START = new Set(["start", "yes", "unstop", "alta"]);

export async function applySmsKeyword(fromRaw: string, bodyRaw: string) {
  const from = String(fromRaw || "").replace(/^whatsapp:/i, "").trim();
  const body = String(bodyRaw || "").trim().toLowerCase();
  if (!from || !body) return { ok: true as const, action: null as null };
  const hash = contactHash("phone", from);
  if (!hash) return { ok: true as const, action: null as null };
  const keyword = body.split(/\s+/)[0] || "";
  if (STOP.has(keyword)) {
    await query(`UPDATE patients SET sms_opt_out = true, consent_sms = false WHERE mobile_hash = $1`, [hash]);
    log.info("messages", "opt-out SMS", { action: "stop" });
    return { ok: true as const, action: "stop" as const };
  }
  if (START.has(keyword)) {
    await query(`UPDATE patients SET sms_opt_out = false, consent_sms = true WHERE mobile_hash = $1`, [hash]);
    log.info("messages", "opt-in SMS", { action: "start" });
    return { ok: true as const, action: "start" as const };
  }
  return { ok: true as const, action: null as null };
}
