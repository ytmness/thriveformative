import { NextResponse } from "next/server";
import { fetchStoreProductsFromDb } from "@/lib/store/db";
import { isAdminAuthenticated } from "@/lib/adminSession";
import type { Locale } from "@/lib/store/types";

const LOCALES = new Set(["es", "en", "ko", "it"]);

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const locale = (url.searchParams.get("locale") || "es") as Locale;
    if (!LOCALES.has(locale)) {
      return NextResponse.json({ error: "locale inválido" }, { status: 400 });
    }
    const wantAll = url.searchParams.get("all") === "1";
    const includeUnpublished = wantAll && (await isAdminAuthenticated());
    const category = url.searchParams.get("category");
    return NextResponse.json(
      await fetchStoreProductsFromDb(locale, {
        includeUnpublished,
        categorySlug: category,
      })
    );
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Error" },
      { status: 500 }
    );
  }
}
