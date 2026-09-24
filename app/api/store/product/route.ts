import { NextResponse } from "next/server";
import { fetchStoreProductByRefFromDb } from "@/lib/store/db";
import { isAdminAuthenticated } from "@/lib/adminSession";
import type { Locale } from "@/lib/store/types";

const LOCALES = new Set(["es", "en", "ko", "it"]);

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const locale = (url.searchParams.get("locale") || "es") as Locale;
    const ref = url.searchParams.get("ref");
    if (!LOCALES.has(locale) || !ref) {
      return NextResponse.json({ error: "locale/ref inválidos" }, { status: 400 });
    }
    const wantAll = url.searchParams.get("all") === "1";
    const includeUnpublished = wantAll && (await isAdminAuthenticated());
    return NextResponse.json(
      await fetchStoreProductByRefFromDb(locale, ref, { includeUnpublished })
    );
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Error" },
      { status: 500 }
    );
  }
}
