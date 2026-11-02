import { NextResponse } from "next/server";
import { dispatchDueMessages } from "@/lib/messaging/queue";
import { notifyExpiringMemberships } from "@/lib/domain/membershipPolicy";
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
  const [messages, webhooks, memberships] = await Promise.all([
    dispatchDueMessages(),
    retryWebhooks(),
    notifyExpiringMemberships(),
  ]);
  return Response.json({ messages, webhooks, memberships });
}
