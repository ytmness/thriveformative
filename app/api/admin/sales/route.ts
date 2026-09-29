import { isSession, requirePermission } from "@/lib/auth/guard";
import { createSale, listSales } from "@/lib/domain/sales";
import { readJson, toErrorResponse } from "@/lib/http";

export async function GET(req: Request) {
  const session = await requirePermission("sales.read");
  if (!isSession(session)) return session;
  try {
    return Response.json(await listSales(new URL(req.url)));
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function POST(req: Request) {
  const session = await requirePermission("sales.write");
  if (!isSession(session)) return session;
  try {
    return Response.json(await createSale((await readJson(req)) as never, session));
  } catch (error) {
    return toErrorResponse(error);
  }
}
