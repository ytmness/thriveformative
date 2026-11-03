import { NextResponse } from "next/server";
import { applySmsKeyword } from "@/lib/messaging/optOut";
import { verifyTelnyxSignature } from "@/lib/messaging/verify";
import { log } from "@/lib/log";

export async function POST(req: Request) {
  const raw = await req.text();
  if (!verifyTelnyxSignature(raw, req.headers)) {
    log.warn("messages", "webhook Telnyx rechazado", { reason: "firma" });
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  let payload: unknown = {};
  try {
    payload = raw ? JSON.parse(raw) : {};
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }
  const root = payload && typeof payload === "object" ? (payload as Record<string, unknown>) : {};
  const data = root.data && typeof root.data === "object" ? (root.data as Record<string, unknown>) : root;
  const payloadObj = data.payload && typeof data.payload === "object" ? (data.payload as Record<string, unknown>) : data;
  const fromValue =
    typeof payloadObj.from === "object" && payloadObj.from
      ? String((payloadObj.from as { phone_number?: string }).phone_number || "")
      : String(payloadObj.from || payloadObj.From || "");
  const text = String(payloadObj.text || payloadObj.body || payloadObj.Body || "");
  await applySmsKeyword(fromValue, text);
  return NextResponse.json({ ok: true });
}
