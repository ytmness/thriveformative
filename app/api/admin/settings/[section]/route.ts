import { isSession, requirePermission } from "@/lib/auth/guard";
import { createSection, listSection } from "@/lib/domain/settings";
import { readJson, toErrorResponse } from "@/lib/http";

export async function GET(_req: Request, ctx: { params: Promise<{ section: string }> }) {
  const { section } = await ctx.params;
  const session = await requirePermission("settings.read");
  if (!isSession(session)) return session;
  try {
    return Response.json({ rows: await listSection(section) });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function POST(req: Request, ctx: { params: Promise<{ section: string }> }) {
  const { section } = await ctx.params;
  const session = await requirePermission("settings.write");
  if (!isSession(session)) return session;
  try {
    return Response.json(await createSection(section, await readJson(req), session));
  } catch (error) {
    return toErrorResponse(error);
  }
}
