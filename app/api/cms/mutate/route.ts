import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/adminSession";
import { query } from "@/lib/db";

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
      rows?: { content_key: string; value: string }[];
    };
    const { op } = body;

    if (op === "saveService") {
      const p = body.payload!;
      const isNew = !body.id || String(body.id).startsWith("new-");
      if (isNew) {
        const res = await query(
          `INSERT INTO cms_services (locale, sort_order, name, description, is_published)
           VALUES ($1,$2,$3,$4,$5)
           RETURNING id, locale, sort_order, name, description, is_published`,
          [p.locale, p.sort_order, p.name, p.description, p.is_published]
        );
        return NextResponse.json({ data: res.rows[0] });
      }
      const res = await query(
        `UPDATE cms_services SET locale=$1, sort_order=$2, name=$3, description=$4,
         is_published=$5, updated_at=now() WHERE id=$6
         RETURNING id, locale, sort_order, name, description, is_published`,
        [p.locale, p.sort_order, p.name, p.description, p.is_published, body.id]
      );
      return NextResponse.json({ data: res.rows[0] });
    }

    if (op === "deleteService") {
      await query(`DELETE FROM cms_services WHERE id=$1`, [body.id]);
      return NextResponse.json({ ok: true });
    }

    if (op === "savePlan") {
      const p = body.payload!;
      const isNew = !body.id || String(body.id).startsWith("new-");
      const items = JSON.stringify(p.items ?? []);
      if (isNew) {
        const res = await query(
          `INSERT INTO cms_plans (locale, sort_order, name, items, is_featured, is_published)
           VALUES ($1,$2,$3,$4::jsonb,$5,$6)
           RETURNING id, locale, sort_order, name, items, is_featured, is_published`,
          [p.locale, p.sort_order, p.name, items, p.is_featured, p.is_published]
        );
        return NextResponse.json({ data: res.rows[0] });
      }
      const res = await query(
        `UPDATE cms_plans SET locale=$1, sort_order=$2, name=$3, items=$4::jsonb,
         is_featured=$5, is_published=$6, updated_at=now() WHERE id=$7
         RETURNING id, locale, sort_order, name, items, is_featured, is_published`,
        [p.locale, p.sort_order, p.name, items, p.is_featured, p.is_published, body.id]
      );
      return NextResponse.json({ data: res.rows[0] });
    }

    if (op === "deletePlan") {
      await query(`DELETE FROM cms_plans WHERE id=$1`, [body.id]);
      return NextResponse.json({ ok: true });
    }

    if (op === "saveArticle") {
      const p = body.payload!;
      const isNew = !body.id || String(body.id).startsWith("new-");
      if (isNew) {
        const res = await query(
          `INSERT INTO cms_articles
           (locale, sort_order, category, title, body, image_url, is_published, published_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
           RETURNING id, locale, sort_order, category, title, body, image_url, is_published, published_at`,
          [
            p.locale,
            p.sort_order,
            p.category,
            p.title,
            p.body,
            p.image_url,
            p.is_published,
            p.published_at,
          ]
        );
        return NextResponse.json({ data: res.rows[0] });
      }
      const res = await query(
        `UPDATE cms_articles SET locale=$1, sort_order=$2, category=$3, title=$4, body=$5,
         image_url=$6, is_published=$7, published_at=$8, updated_at=now() WHERE id=$9
         RETURNING id, locale, sort_order, category, title, body, image_url, is_published, published_at`,
        [
          p.locale,
          p.sort_order,
          p.category,
          p.title,
          p.body,
          p.image_url,
          p.is_published,
          p.published_at,
          body.id,
        ]
      );
      return NextResponse.json({ data: res.rows[0] });
    }

    if (op === "deleteArticle") {
      await query(`DELETE FROM cms_articles WHERE id=$1`, [body.id]);
      return NextResponse.json({ ok: true });
    }

    if (op === "upsertTexts") {
      const locale = body.locale;
      const rows = body.rows ?? [];
      for (const row of rows) {
        await query(
          `INSERT INTO cms_text_entries (locale, content_key, value, updated_at)
           VALUES ($1,$2,$3,now())
           ON CONFLICT (locale, content_key)
           DO UPDATE SET value = EXCLUDED.value, updated_at = now()`,
          [locale, row.content_key, row.value]
        );
      }
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: `op desconocida: ${op}` }, { status: 400 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Error" },
      { status: 500 }
    );
  }
}
