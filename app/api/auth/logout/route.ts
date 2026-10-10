import { clearPortalSession } from "@/lib/auth/portal";

export async function POST() {
  await clearPortalSession().catch(() => undefined);
  return Response.json({ ok: true });
}
