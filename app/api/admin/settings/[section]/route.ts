import { isSession, requirePermission } from "@/lib/auth/guard";
import type { StaffSession } from "@/lib/auth/session";
import { createSection, listSection } from "@/lib/domain/settings";
import { readJson, toErrorResponse } from "@/lib/http";
import { NextResponse } from "next/server";

const SALES_READABLE = new Set(["payment-methods", "locations", "services"]);

async function canList(section: string): Promise<StaffSession | NextResponse> {
  const settings = await requirePermission("settings.read");
  if (isSession(settings) || !SALES_READABLE.has(section)) return settings;
  const sales = await requirePermission("sales.read");
  if (isSession(sales) || section !== "locations") return sales;
  return requirePermission("inventory.read");
}

export async function GET(_req: Request, ctx: { params: Promise<{ section: string }> }) {
  const { section } = await ctx.params;
  const session = await canList(section);
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
