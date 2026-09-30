import { NextResponse } from "next/server";
import { fetchStoreCategoriesFromDb } from "@/lib/store/db";
import type { Locale } from "@/lib/store/types";

const LOCALES = new Set(["es", "en", "ko", "it"]);

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const locale = (url.searchParams.get("locale") || "es") as Locale;
    if (!LOCALES.has(locale)) {
      return NextResponse.json({ error: "locale inválido" }, { status: 400 });
    }
    return NextResponse.json(await fetchStoreCategoriesFromDb(locale, url.searchParams.get("country")));
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Error" },
      { status: 500 }
    );
  }
}
