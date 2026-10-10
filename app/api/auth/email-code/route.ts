import { createClient } from "@supabase/supabase-js";
import { sendSavedTemplateEmail } from "@/lib/emailServer";
import { getClientEnv } from "@/lib/env/client";
import { getServiceRoleKey, getSiteUrl } from "@/lib/env/server";

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { email?: string; locale?: string } | null;
  const email = String(body?.email || "").trim().toLowerCase();
  const locale = body?.locale === "en" ? "en" : "es";
  if (!isEmail(email)) {
    return Response.json({ error: locale === "en" ? "Enter a valid email." : "Escribe un correo válido." }, { status: 400 });
  }

  const serviceKey = getServiceRoleKey();
  let supabaseUrl = "";
  try {
    supabaseUrl = getClientEnv().supabaseUrl;
  } catch {
    supabaseUrl = "";
  }
  if (!serviceKey || !supabaseUrl) {
    return Response.json({ error: locale === "en" ? "Mail is not configured." : "El correo no está configurado." }, { status: 500 });
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const redirectTo = `${getSiteUrl()}/auth/callback`;
  let verifyType: "magiclink" | "invite" = "magiclink";
  let generated = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
    options: { redirectTo },
  });
  if (generated.error) {
    verifyType = "invite";
    generated = await admin.auth.admin.generateLink({
      type: "invite",
      email,
      options: { redirectTo },
    });
  }
  const code = generated.data?.properties?.email_otp;
  if (generated.error || !code) {
    return Response.json({ error: locale === "en" ? "Could not send the code." : "No se pudo enviar el código." }, { status: 400 });
  }

  const fallback = locale === "en"
    ? {
        subject: "Your Thrive Formative code",
        text: `Hello,\n\nYour Thrive Formative access code is:\n\n${code}\n\nIt expires in a few minutes. If you did not ask for it, ignore this email.`,
      }
    : {
        subject: "Tu código de Thrive Formative",
        text: `Hola,\n\nTu código de acceso a Thrive Formative es:\n\n${code}\n\nCaduca en unos minutos. Si no lo pediste, ignora este correo.`,
      };
  const sent = await sendSavedTemplateEmail({
    templateKey: "acceso",
    locale,
    to: email,
    vars: { codigo: code, email, enlace: generated.data?.properties?.action_link || redirectTo },
    fallbackSubject: fallback.subject,
    fallbackText: fallback.text,
  });
  if (!sent.ok) {
    return Response.json({ error: locale === "en" ? "Could not send the email." : "No se pudo enviar el correo." }, { status: 502 });
  }
  return Response.json({ ok: true, verifyType });
}
