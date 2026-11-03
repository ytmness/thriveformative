import { NextResponse } from "next/server";
import { reprocessUnassignedGranolaNotes } from "@/lib/domain/granolaInbox";
import { dispatchDueMessages } from "@/lib/messaging/queue";
import { notifyExpiringMemberships } from "@/lib/domain/membershipPolicy";
import { renewDueMemberships } from "@/lib/domain/membershipRenewal";
import { retryWebhooks } from "@/lib/webhooks/emit";

function authorized(req: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret || req.headers.get("x-cron-secret") !== secret) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  return null;
}

export async function POST(req: Request) {
  const denied = authorized(req);
  if (denied) return denied;
  const [messages, webhooks, memberships, renewals, granola] = await Promise.all([
    dispatchDueMessages(),
    retryWebhooks(),
    notifyExpiringMemberships(),
    renewDueMemberships(),
    reprocessUnassignedGranolaNotes(40).catch((error) => ({
      processed: 0,
      assigned: 0,
      failed: 0,
      error: error instanceof Error ? error.message : "granola_reprocess_failed",
    })),
  ]);
  return Response.json({ messages, webhooks, memberships, renewals, granola });
}
