import { NextResponse } from "next/server";
import { applySmsKeyword } from "@/lib/messaging/optOut";
import { verifyMetaSignature } from "@/lib/messaging/verify";
import { log } from "@/lib/log";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");
  const expected = process.env.WHATSAPP_VERIFY_TOKEN?.trim();
  if (mode === "subscribe" && expected && token === expected && challenge) {
    return new Response(challenge, { status: 200 });
  }
  return NextResponse.json({ error: "No autorizado" }, { status: 401 });
}

export async function POST(req: Request) {
  const raw = await req.text();
  if (!verifyMetaSignature(raw, req.headers)) {
    log.warn("messages", "webhook Meta rechazado", { reason: "firma" });
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  let payload: unknown = {};
  try {
    payload = raw ? JSON.parse(raw) : {};
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }
  const root = payload && typeof payload === "object" ? (payload as Record<string, unknown>) : {};
  const entries = Array.isArray(root.entry) ? root.entry : [];
  for (const entry of entries) {
    const changes = entry && typeof entry === "object" && Array.isArray((entry as { changes?: unknown[] }).changes)
      ? (entry as { changes: unknown[] }).changes
      : [];
    for (const change of changes) {
      const value = change && typeof change === "object" ? (change as { value?: Record<string, unknown> }).value : null;
      const messages = value && Array.isArray(value.messages) ? value.messages : [];
      for (const message of messages) {
        const msg = message && typeof message === "object" ? (message as Record<string, unknown>) : null;
        if (!msg) continue;
        const from = String(msg.from || "");
        const text =
          msg.text && typeof msg.text === "object"
            ? String((msg.text as { body?: string }).body || "")
            : String(msg.body || "");
        await applySmsKeyword(from, text);
      }
    }
  }
  return NextResponse.json({ ok: true });
}
