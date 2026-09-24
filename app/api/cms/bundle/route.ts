import { NextResponse } from "next/server";
import { fetchCmsBundleFromDb } from "@/lib/cms/db";
import { isAdminAuthenticated } from "@/lib/adminSession";
import type { Locale } from "@/lib/cms/types";

const LOCALES = new Set(["es", "en", "ko", "it"]);

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const locale = (searchParams.get("locale") || "es") as Locale;
    if (!LOCALES.has(locale)) {
      return NextResponse.json({ error: "locale inválido" }, { status: 400 });
    }
    const wantAll = searchParams.get("all") === "1";
    const includeUnpublished = wantAll && (await isAdminAuthenticated());
    const bundle = await fetchCmsBundleFromDb(locale, { includeUnpublished });
    return NextResponse.json(bundle);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Error CMS" },
      { status: 500 }
    );
  }
}
