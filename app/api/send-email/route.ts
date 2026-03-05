import { NextRequest, NextResponse } from "next/server";
import { sendEmailPayload, type EmailKind } from "@/lib/emailServer";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body || typeof body.kind !== "string") {
      return NextResponse.json({ ok: false, error: "Payload inválido" }, { status: 400 });
    }

    let payload: EmailKind;

    switch (body.kind) {
      case "appointment_pending":
      case "appointment_confirmed":
      case "appointment_cancelled":
        if (typeof body.to !== "string" || typeof body.date !== "string" || typeof body.timeSlot !== "string") {
          return NextResponse.json({ ok: false, error: "Faltan to, date o timeSlot" }, { status: 400 });
        }
        payload = { kind: body.kind, to: body.to, date: body.date, timeSlot: body.timeSlot };
        break;
      case "contact_confirmation":
        if (typeof body.to !== "string" || typeof body.name !== "string") {
          return NextResponse.json({ ok: false, error: "Faltan to o name" }, { status: 400 });
        }
        payload = { kind: body.kind, to: body.to, name: body.name };
        break;
      case "contact_notify_admin": {
        const adminTo = process.env.NOTIFY_EMAIL;
        if (!adminTo) {
          return NextResponse.json({ ok: false, error: "NOTIFY_EMAIL no configurado" }, { status: 500 });
        }
        if (typeof body.name !== "string" || typeof body.email !== "string" || typeof body.message !== "string") {
          return NextResponse.json({ ok: false, error: "Faltan name, email o message" }, { status: 400 });
        }
        payload = {
          kind: body.kind,
          to: adminTo,
          name: body.name,
          email: body.email,
          subject: body.subject ?? null,
          message: body.message,
        };
        break;
      }
      default:
        return NextResponse.json({ ok: false, error: "Tipo de email no válido" }, { status: 400 });
    }

    const result = await sendEmailPayload(payload);
    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
