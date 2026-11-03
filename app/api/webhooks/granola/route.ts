import { NextResponse } from "next/server";
import { ingestGranolaEvent } from "@/lib/domain/granolaInbox";
import { verifyGranolaSignature } from "@/lib/granola/verify";
import { log } from "@/lib/log";

const ACCEPTED = new Set(["note.generated", "note.edited", "note.access_granted"]);

export async function POST(req: Request) {
  const secret = process.env.GRANOLA_WEBHOOK_SECRET?.trim();
  const raw = await req.text();
  if (!secret || !verifyGranolaSignature(raw, req.headers, secret)) {
    log.warn("granola", "webhook rechazado", { reason: secret ? "firma" : "sin_secreto" });
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  let payload: unknown = {};
  try {
    payload = raw ? JSON.parse(raw) : {};
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }
  const root = payload && typeof payload === "object" ? (payload as Record<string, unknown>) : {};
  const eventType = String(root.event_type || root.type || "").trim();
  if (eventType && !ACCEPTED.has(eventType)) {
    return NextResponse.json({ received: true, ignored: true, eventType });
  }
  const result = await ingestGranolaEvent(payload);
  return NextResponse.json({ received: true, ...result });
}
