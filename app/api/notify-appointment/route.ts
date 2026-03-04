import { NextResponse } from "next/server";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_FROM = process.env.RESEND_FROM ?? "Thrive Formative <onboarding@resend.dev>";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { toEmail, userName, appointmentDate, timeSlot, status } = body as {
      toEmail?: string;
      userName?: string;
      appointmentDate?: string;
      timeSlot?: string;
      status?: string;
    };

    if (!toEmail?.trim()) {
      return NextResponse.json({ ok: false, error: "toEmail required" }, { status: 400 });
    }

    if (!RESEND_API_KEY) {
      return NextResponse.json({ ok: true, skipped: "RESEND_API_KEY not set" });
    }

    const isConfirmed = status === "confirmed";
    const subject = isConfirmed
      ? "Tu cita ha sido confirmada — Thrive Formative"
      : "Actualización de tu cita — Thrive Formative";
    const intro = isConfirmed
      ? "Tu cita ha sido confirmada."
      : "Tu cita ha sido cancelada.";
    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: sans-serif; line-height: 1.6; color: #333; max-width: 560px; margin: 0 auto; padding: 20px;">
  <p>Hola${userName ? ` ${userName}` : ""},</p>
  <p>${intro}</p>
  <p><strong>Fecha:</strong> ${appointmentDate ?? "—"}<br><strong>Hora:</strong> ${timeSlot ?? "—"}</p>
  ${isConfirmed ? "<p>Te esperamos. Si necesitas reprogramar, contáctanos.</p>" : "<p>Si deseas agendar una nueva cita, contáctanos.</p>"}
  <p>Saludos,<br>Thrive Formative</p>
</body>
</html>`;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: RESEND_FROM,
        to: [toEmail.trim()],
        subject,
        html,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Resend error:", res.status, err);
      return NextResponse.json({ ok: false, error: err }, { status: 502 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("notify-appointment error:", e);
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
