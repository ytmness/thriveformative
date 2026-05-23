import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  buildThriveEmailHtml,
  emailParagraph,
  emailSignOff,
  escapeHtml,
} from "../_shared/emailTemplate.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const RESEND_FROM = Deno.env.get("RESEND_FROM") ?? "Thrive Formative <onboarding@resend.dev>";

type WebhookPayload = {
  type: "INSERT" | "UPDATE" | "DELETE";
  table: string;
  schema: string;
  record: Record<string, unknown> | null;
  old_record: Record<string, unknown> | null;
};

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const payload = (await req.json()) as WebhookPayload;
    if (payload.table !== "appointments" || payload.type !== "UPDATE" || !payload.record || !payload.old_record) {
      return new Response(JSON.stringify({ ok: true, skipped: "not an appointment update" }));
    }

    const record = payload.record as { status?: string; user_id?: string; appointment_date?: string; time_slot?: string };
    const oldRecord = payload.old_record as { status?: string };
    const newStatus = record.status;
    const oldStatus = oldRecord?.status;

    if (newStatus !== "confirmed" && newStatus !== "cancelled") {
      return new Response(JSON.stringify({ ok: true, skipped: "status not confirmed/cancelled" }));
    }
    if (newStatus === oldStatus) {
      return new Response(JSON.stringify({ ok: true, skipped: "status unchanged" }));
    }

    if (!RESEND_API_KEY) {
      return new Response(JSON.stringify({ ok: true, skipped: "RESEND_API_KEY not set" }));
    }

    const userId = record.user_id;
    if (!userId) {
      return new Response(JSON.stringify({ ok: true, skipped: "no user_id" }));
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });

    const { data: profile } = await supabase
      .from("profiles")
      .select("email, full_name")
      .eq("id", userId)
      .maybeSingle();

    const email = (profile as { email?: string } | null)?.email?.trim();
    if (!email) {
      return new Response(JSON.stringify({ ok: true, skipped: "no email in profile" }));
    }

    const userName = (profile as { full_name?: string } | null)?.full_name?.trim();
    const date = record.appointment_date ?? "—";
    const timeSlot = record.time_slot ?? "—";
    const isConfirmed = newStatus === "confirmed";
    const subject = isConfirmed
      ? "Thrive Formative – Cita confirmada"
      : "Thrive Formative – Cita cancelada";

    const greeting = userName ? `Hola ${escapeHtml(userName)},` : "Hola,";
    const bodyMessage = isConfirmed
      ? `Tu cita del <strong>${escapeHtml(date)}</strong> a las <strong>${escapeHtml(timeSlot)}</strong> ha sido <strong>confirmada</strong>. Te esperamos. Si necesitas reprogramar, contáctanos.`
      : `Tu cita del <strong>${escapeHtml(date)}</strong> a las <strong>${escapeHtml(timeSlot)}</strong> ha sido <strong>cancelada</strong>. Si deseas agendar una nueva cita, contáctanos.`;

    const html = buildThriveEmailHtml(`${emailParagraph(greeting)}${emailParagraph(bodyMessage)}${emailSignOff()}`);

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: RESEND_FROM,
        to: [email],
        subject,
        html,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Resend error:", res.status, err);
      return new Response(JSON.stringify({ ok: false, error: err }), { status: 502, headers: { "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ ok: true }), { headers: { "Content-Type": "application/json" } });
  } catch (e) {
    console.error("send-appointment-email error:", e);
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
});
