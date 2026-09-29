import { isSession, requirePermission } from "@/lib/auth/guard";
import { deleteSection, updateSection } from "@/lib/domain/settings";
import { readJson, toErrorResponse } from "@/lib/http";

export async function PATCH(req: Request, ctx: { params: Promise<{ section: string; id: string }> }) {
  const session = await requirePermission("settings.write");
  if (!isSession(session)) return session;
  try {
    const { section, id } = await ctx.params;
    return Response.json(await updateSection(section, id, await readJson(req), session));
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ section: string; id: string }> }) {
  const session = await requirePermission("settings.write");
  if (!isSession(session)) return session;
  try {
    const { section, id } = await ctx.params;
    return Response.json(await deleteSection(section, id, session));
  } catch (error) {
    return toErrorResponse(error);
  }
}
