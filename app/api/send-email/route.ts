import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendEmailPayload, type EmailKind } from "@/lib/emailServer";
import { requireNotifyEmail } from "@/lib/env/server";
import { log } from "@/lib/log";
import { checkRateLimit } from "@/lib/rate-limit/memory";
import { GENERIC_ERROR, handleRouteError, jsonError, jsonOk } from "@/lib/security/errors";
import {
  getClientIp,
  invalidJsonResponse,
  InvalidJsonError,
  PayloadTooLargeError,
  payloadTooLargeResponse,
  rateLimitedResponse,
  readJsonBody,
} from "@/lib/security/request";
import { sendEmailBodySchema } from "@/lib/validation/schemas";

const RATE_LIMIT = { limit: 10, windowMs: 15 * 60 * 1000 };

async function resolveAdminRecipient(
  supabase: Awaited<ReturnType<typeof createClient>>,
  appointmentId: string
): Promise<string | null> {
  const { data: appt, error: apptErr } = await supabase
    .from("appointments")
    .select("user_id")
    .eq("id", appointmentId)
    .maybeSingle();

  if (apptErr || !appt?.user_id) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("email")
    .eq("id", appt.user_id)
    .maybeSingle();

  return profile?.email?.trim() || null;
}

async function assertAdmin(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
): Promise<boolean> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();
  return profile?.role === "admin";
}

export async function POST(request: NextRequest) {
  const scope = "send-email";

  try {
    const ip = getClientIp(request);
    const rate = checkRateLimit(`send-email:${ip}`, RATE_LIMIT);
    if (!rate.allowed) {
      return rateLimitedResponse(rate.retryAfterSec);
    }

    const raw = await readJsonBody(request);
    const parsed = sendEmailBodySchema.safeParse(raw);
    if (!parsed.success) {
      return jsonError(400, "Solicitud inválida.");
    }

    const body = parsed.data;
    if (body.website?.trim()) {
      return jsonOk();
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    let payload: EmailKind;

    switch (body.kind) {
      case "appointment_pending": {
        if (!user?.email) {
          return jsonError(401, "Debes iniciar sesión para solicitar una cita.");
        }
        payload = {
          kind: body.kind,
          to: user.email,
          date: body.date,
          timeSlot: body.timeSlot,
        };
        break;
      }
      case "appointment_confirmed":
      case "appointment_cancelled": {
        if (!user) {
          return jsonError(401, "No autorizado.");
        }
        const isAdmin = await assertAdmin(supabase, user.id);
        if (!isAdmin) {
          return jsonError(403, "No autorizado.");
        }
        const recipient = await resolveAdminRecipient(supabase, body.appointmentId);
        if (!recipient) {
          return jsonError(400, "No se encontró el email del cliente para esta cita.");
        }
        payload = {
          kind: body.kind,
          to: recipient,
          date: body.date,
          timeSlot: body.timeSlot,
        };
        break;
      }
      case "contact_confirmation": {
        payload = {
          kind: body.kind,
          to: body.email,
          name: body.name,
        };
        break;
      }
      case "contact_notify_admin": {
        payload = {
          kind: body.kind,
          to: requireNotifyEmail(),
          name: body.name,
          email: body.email,
          subject: body.subject ?? null,
          message: body.message,
        };
        break;
      }
      default:
        return jsonError(400, "Tipo de email no válido.");
    }

    const result = await sendEmailPayload(payload);
    if (!result.ok) {
      log.warn(scope, "send failed", { kind: body.kind });
      return jsonError(500, GENERIC_ERROR);
    }

    log.info(scope, "sent", { kind: body.kind });
    return jsonOk();
  } catch (error) {
    if (error instanceof PayloadTooLargeError) return payloadTooLargeResponse();
    if (error instanceof InvalidJsonError) return invalidJsonResponse();
    return handleRouteError(scope, error);
  }
}
