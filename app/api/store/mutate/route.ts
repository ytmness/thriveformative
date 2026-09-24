import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/adminSession";
import { query } from "@/lib/db";
import { PRODUCT_FIELDS_SQL } from "@/lib/store/fields";
import { fetchStoreCategoriesFromDb } from "@/lib/store/db";
import { attachCategoryToProduct } from "@/lib/store/fetch";
import type { ProductRow } from "@/lib/store/fields";
import type { Locale } from "@/lib/store/types";
import { slugifyRef } from "@/lib/store/slug";

async function requireAdmin() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  return null;
}

export async function POST(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const body = (await req.json()) as {
      op: string;
      id?: string;
      locale?: string;
      payload?: Record<string, unknown>;
      name?: string;
    };

    if (body.op === "saveProduct") {
      const p = body.payload!;
      const isNew = !body.id;
      const cols = [
        p.locale,
        p.sort_order,
        p.name,
        p.description,
        p.ref,
        p.referral_url,
        p.image_url,
        p.category_id,
        p.is_published,
        p.price_min,
        p.price_max,
        p.compare_at_price_min,
        p.currency,
        p.source,
        p.source_handle,
      ];
      let res;
      if (isNew) {
        res = await query<ProductRow>(
          `INSERT INTO store_products
           (locale, sort_order, name, description, ref, referral_url, image_url,
            category_id, is_published, price_min, price_max, compare_at_price_min,
            currency, source, source_handle)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
           RETURNING ${PRODUCT_FIELDS_SQL}`,
          cols
        );
      } else {
        res = await query<ProductRow>(
          `UPDATE store_products SET
           locale=$1, sort_order=$2, name=$3, description=$4, ref=$5, referral_url=$6,
           image_url=$7, category_id=$8, is_published=$9, price_min=$10, price_max=$11,
           compare_at_price_min=$12, currency=$13, source=$14, source_handle=$15,
           updated_at=now()
           WHERE id=$16
           RETURNING ${PRODUCT_FIELDS_SQL}`,
          [...cols, body.id]
        );
      }
      const cats = await fetchStoreCategoriesFromDb(p.locale as Locale);
      return NextResponse.json({
        data: attachCategoryToProduct(res.rows[0], cats),
      });
    }

    if (body.op === "deleteProduct") {
      await query(`DELETE FROM store_products WHERE id=$1`, [body.id]);
      return NextResponse.json({ ok: true });
    }

    if (body.op === "toggleProduct") {
      const res = await query<ProductRow>(
        `UPDATE store_products SET is_published = NOT is_published, updated_at=now()
         WHERE id=$1 RETURNING ${PRODUCT_FIELDS_SQL}`,
        [body.id]
      );
      const locale = (res.rows[0]?.locale || body.locale || "es") as Locale;
      const cats = await fetchStoreCategoriesFromDb(locale);
      return NextResponse.json({
        data: attachCategoryToProduct(res.rows[0], cats),
      });
    }

    if (body.op === "saveCategory") {
      const locale = body.locale as Locale;
      const name = String(body.name ?? "").trim();
      const slug = slugifyRef(name);
      const sortRes = await query<{ m: number }>(
        `SELECT COALESCE(MAX(sort_order), -1) + 1 AS m FROM store_categories WHERE locale=$1`,
        [locale]
      );
      const res = await query(
        `INSERT INTO store_categories (locale, name, slug, sort_order)
         VALUES ($1,$2,$3,$4)
         RETURNING id, locale, name, slug, sort_order`,
        [locale, name, slug, sortRes.rows[0]?.m ?? 0]
      );
      return NextResponse.json({ data: res.rows[0] });
    }

    if (body.op === "deleteCategory") {
      await query(`DELETE FROM store_categories WHERE id=$1`, [body.id]);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: `op desconocida: ${body.op}` }, { status: 400 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error";
    const friendly = msg.includes("store_products_locale_ref_key")
      ? "Ya existe un producto con ese ref en este idioma."
      : msg;
    return NextResponse.json({ error: friendly }, { status: 500 });
  }
}
