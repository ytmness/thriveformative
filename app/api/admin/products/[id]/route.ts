import { isSession, requirePermission } from "@/lib/auth/guard";
import { archiveCatalogItem, saveProduct, saveSimple } from "@/lib/domain/catalog";
import { readJson, toErrorResponse } from "@/lib/http";

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await requirePermission("inventory.write");
  if (!isSession(session)) return session;
  try {
    const { id } = await ctx.params;
    const body = await readJson(req);
    if (body.kind === "package" || body.kind === "membership") {
      return Response.json(await saveSimple(body.kind === "package" ? "packages" : "memberships", id, body));
    }
    return Response.json(await saveProduct(id, body));
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await requirePermission("inventory.write");
  if (!isSession(session)) return session;
  try {
    const { id } = await ctx.params;
    const kind = new URL(req.url).searchParams.get("kind");
    const item = kind === "package" || kind === "membership" ? kind : "product";
    return Response.json(await archiveCatalogItem(item, id));
  } catch (error) {
    return toErrorResponse(error);
  }
}
