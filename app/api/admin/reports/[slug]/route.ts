import { isSession, requirePermission } from "@/lib/auth/guard";
import { runReport } from "@/lib/domain/reports";
import { toErrorResponse } from "@/lib/http";

export async function GET(req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const session = await requirePermission("reports.read");
  if (!isSession(session)) return session;
  try {
    const { slug } = await ctx.params;
    return Response.json(await runReport(slug, new URL(req.url)));
  } catch (error) {
    return toErrorResponse(error);
  }
}
