import { NextResponse } from "next/server";
import { ingestGranolaEvent } from "@/lib/domain/granolaInbox";
import { verifyGranolaSignature } from "@/lib/granola/verify";
import { log } from "@/lib/log";

export async function POST(req: Request) {
  const secret = process.env.GRANOLA_WEBHOOK_SECRET?.trim();
  const raw = await req.text();
  if (secret && !verifyGranolaSignature(raw, req.headers, secret)) {
    log.warn("granola", "webhook rechazado", { reason: "firma" });
    return NextResponse.json({ error: "Firma inválida" }, { status: 400 });
  }
  let payload: unknown = {};
  try {
    payload = raw ? JSON.parse(raw) : {};
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }
  const type = payload && typeof payload === "object" && "type" in payload ? String((payload as { type?: string }).type || "") : "";
  if (type && type !== "note.generated" && type !== "note.edited") {
    return NextResponse.json({ received: true, ignored: true });
  }
  const result = await ingestGranolaEvent(payload);
  return NextResponse.json({ received: true, ...result });
}
