"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase";
import { fetchCmsBundle } from "@/lib/cms/fetch";
import { CMS_TEXT_GROUPS } from "@/lib/cms/textKeys";
import type { CmsArticle, CmsPlan, CmsService, Locale } from "@/lib/cms/types";
import { CMS_LOCALES } from "@/lib/cms/types";
import "@/app/styles/admin-cms.css";

type SubTab = "services" | "plans" | "articles" | "texts";

const LOCALE_LABELS: Record<Locale, string> = {
  es: "Español",
  en: "English",
  ko: "한국어",
  it: "Italiano",
};

export default function CmsPanel() {
  const t = useTranslations();
  const [locale, setLocale] = useState<Locale>("es");
  const [subTab, setSubTab] = useState<SubTab>("services");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const [services, setServices] = useState<CmsService[]>([]);
  const [plans, setPlans] = useState<CmsPlan[]>([]);
  const [articles, setArticles] = useState<CmsArticle[]>([]);
  const [textDraft, setTextDraft] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    try {
      const bundle = await fetchCmsBundle(locale, { includeUnpublished: true });
      setServices(bundle.services);
      setPlans(bundle.plans);
      setArticles(bundle.articles);
      const draft: Record<string, string> = { ...bundle.textOverrides };
      CMS_TEXT_GROUPS.forEach((g) =>
        g.keys.forEach((k) => {
          if (!(k.key in draft)) {
            const dot = k.key.indexOf(".");
            const ns = dot >= 0 ? k.key.slice(0, dot) : k.key;
            const leaf = dot >= 0 ? k.key.slice(dot + 1) : "";
            try {
              draft[k.key] = leaf ? t(`${ns}.${leaf}` as never) : "";
            } catch {
              draft[k.key] = "";
            }
          }
        })
      );
      setTextDraft(draft);
    } catch (e) {
      setMessage({
        type: "err",
        text: e instanceof Error ? e.message : "No se pudo cargar el CMS. ¿Ejecutaste la migración 010_cms.sql?",
      });
    } finally {
      setLoading(false);
    }
  }, [locale, t]);

  useEffect(() => {
    load();
  }, [load]);

  async function saveService(row: CmsService) {
    setSaving(true);
    const supabase = createClient();
    const payload = {
      locale,
      sort_order: row.sort_order,
      name: row.name.trim(),
      description: row.description.trim(),
      is_published: row.is_published,
      updated_at: new Date().toISOString(),
    };
    const { error } = row.id.startsWith("new-")
      ? await supabase.from("cms_services").insert(payload)
      : await supabase.from("cms_services").update(payload).eq("id", row.id);
    setSaving(false);
    if (error) {
      setMessage({ type: "err", text: error.message });
      return;
    }
    setMessage({ type: "ok", text: "Servicio guardado." });
    load();
  }

  async function deleteService(id: string) {
    if (id.startsWith("new-")) {
      setServices((prev) => prev.filter((s) => s.id !== id));
      return;
    }
    const supabase = createClient();
    const { error } = await supabase.from("cms_services").delete().eq("id", id);
    if (error) {
      setMessage({ type: "err", text: error.message });
      return;
    }
    load();
  }

  async function savePlan(row: CmsPlan) {
    setSaving(true);
    const supabase = createClient();
    const payload = {
      locale,
      sort_order: row.sort_order,
      name: row.name.trim(),
      items: row.items.filter((x) => x.trim()),
      is_featured: row.is_featured,
      is_published: row.is_published,
      updated_at: new Date().toISOString(),
    };
    const { error } = row.id.startsWith("new-")
      ? await supabase.from("cms_plans").insert(payload)
      : await supabase.from("cms_plans").update(payload).eq("id", row.id);
    setSaving(false);
    if (error) {
      setMessage({ type: "err", text: error.message });
      return;
    }
    setMessage({ type: "ok", text: "Plan guardado." });
    load();
  }

  async function deletePlan(id: string) {
    if (id.startsWith("new-")) {
      setPlans((prev) => prev.filter((p) => p.id !== id));
      return;
    }
    const supabase = createClient();
    const { error } = await supabase.from("cms_plans").delete().eq("id", id);
    if (error) {
      setMessage({ type: "err", text: error.message });
      return;
    }
    load();
  }

  async function saveArticle(row: CmsArticle) {
    setSaving(true);
    const supabase = createClient();
    const payload = {
      locale,
      sort_order: row.sort_order,
      category: row.category.trim(),
      title: row.title.trim(),
      body: row.body?.trim() || null,
      image_url: row.image_url?.trim() || null,
      is_published: row.is_published,
      published_at: row.published_at || new Date().toISOString().slice(0, 10),
      updated_at: new Date().toISOString(),
    };
    const { error } = row.id.startsWith("new-")
      ? await supabase.from("cms_articles").insert(payload)
      : await supabase.from("cms_articles").update(payload).eq("id", row.id);
    setSaving(false);
    if (error) {
      setMessage({ type: "err", text: error.message });
      return;
    }
    setMessage({ type: "ok", text: "Artículo guardado." });
    load();
  }

  async function deleteArticle(id: string) {
    if (id.startsWith("new-")) {
      setArticles((prev) => prev.filter((a) => a.id !== id));
      return;
    }
    const supabase = createClient();
    const { error } = await supabase.from("cms_articles").delete().eq("id", id);
    if (error) {
      setMessage({ type: "err", text: error.message });
      return;
    }
    load();
  }

  async function saveAllTexts() {
    setSaving(true);
    setMessage(null);
    const supabase = createClient();
    const rows = Object.entries(textDraft)
      .filter(([, v]) => v.trim().length > 0)
      .map(([content_key, value]) => ({
        locale,
        content_key,
        value: value.trim(),
        updated_at: new Date().toISOString(),
      }));

    for (const row of rows) {
      const { error } = await supabase.from("cms_text_entries").upsert(row, {
        onConflict: "locale,content_key",
      });
      if (error) {
        setSaving(false);
        setMessage({ type: "err", text: error.message });
        return;
      }
    }
    setSaving(false);
    setMessage({ type: "ok", text: "Textos guardados." });
    load();
  }

  function addService() {
    setServices((prev) => [
      ...prev,
      {
        id: `new-${Date.now()}`,
        locale,
        sort_order: prev.length,
        name: "",
        description: "",
        is_published: true,
      },
    ]);
  }

  function addPlan() {
    setPlans((prev) => [
      ...prev,
      {
        id: `new-${Date.now()}`,
        locale,
        sort_order: prev.length,
        name: "",
        items: [],
        is_featured: false,
        is_published: true,
      },
    ]);
  }

  function addArticle() {
    setArticles((prev) => [
      ...prev,
      {
        id: `new-${Date.now()}`,
        locale,
        sort_order: prev.length,
        category: "",
        title: "",
        body: null,
        image_url: null,
        is_published: true,
        published_at: new Date().toISOString().slice(0, 10),
      },
    ]);
  }

  if (loading) {
    return <div className="mt-10 animate-pulse h-48 bg-surface rounded-2xl border border-theme" />;
  }

  return (
    <section className="admin-cms mt-10" aria-label="CMS contenido">
      <div className="admin-cms__toolbar">
        <div className="admin-cms__locale-select">
          <label htmlFor="cms-locale">Idioma a editar</label>
          <select
            id="cms-locale"
            value={locale}
            onChange={(e) => setLocale(e.target.value as Locale)}
          >
            {CMS_LOCALES.map((l) => (
              <option key={l} value={l}>
                {LOCALE_LABELS[l]}
              </option>
            ))}
          </select>
        </div>
        <p className="text-sm text-muted max-w-md">
          Si no hay entradas en el CMS, el sitio muestra los textos de los archivos de traducción.
          Al publicar aquí, sustituyen al contenido por idioma.
        </p>
      </div>

      {message && (
        <div className={`admin-cms__msg admin-cms__msg--${message.type}`}>{message.text}</div>
      )}

      <div className="admin-cms__subtabs">
        {(
          [
            ["services", "Servicios"],
            ["plans", "Planes"],
            ["articles", "Artículos"],
            ["texts", "Textos del sitio"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={`admin-cms__subtab${subTab === id ? " admin-cms__subtab--active" : ""}`}
            onClick={() => setSubTab(id)}
          >
            {label}
          </button>
        ))}
      </div>

      {subTab === "services" && (
        <div className="admin-cms__card">
          <button type="button" className="admin-cms__btn mb-4" onClick={addService}>
            + Añadir servicio
          </button>
          {services.map((row, i) => (
            <div key={row.id} className="admin-cms__row">
              <div className="admin-cms__field">
                <label>Nombre</label>
                <input
                  value={row.name}
                  onChange={(e) =>
                    setServices((prev) =>
                      prev.map((s, j) => (j === i ? { ...s, name: e.target.value } : s))
                    )
                  }
                />
              </div>
              <div className="admin-cms__field">
                <label>Descripción</label>
                <textarea
                  value={row.description}
                  onChange={(e) =>
                    setServices((prev) =>
                      prev.map((s, j) => (j === i ? { ...s, description: e.target.value } : s))
                    )
                  }
                />
              </div>
              <div className="flex flex-wrap gap-4 items-center">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={row.is_published}
                    onChange={(e) =>
                      setServices((prev) =>
                        prev.map((s, j) =>
                          j === i ? { ...s, is_published: e.target.checked } : s
                        )
                      )
                    }
                  />
                  Publicado
                </label>
                <div className="admin-cms__field" style={{ width: "5rem" }}>
                  <label>Orden</label>
                  <input
                    type="number"
                    value={row.sort_order}
                    onChange={(e) =>
                      setServices((prev) =>
                        prev.map((s, j) =>
                          j === i ? { ...s, sort_order: parseInt(e.target.value, 10) || 0 } : s
                        )
                      )
                    }
                  />
                </div>
              </div>
              <div className="admin-cms__actions">
                <button
                  type="button"
                  className="admin-cms__btn"
                  disabled={saving}
                  onClick={() => saveService(row)}
                >
                  Guardar
                </button>
                <button
                  type="button"
                  className="admin-cms__btn admin-cms__btn--danger"
                  onClick={() => deleteService(row.id)}
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
          {!services.length && (
            <p className="text-muted text-sm">No hay servicios en CMS para este idioma.</p>
          )}
        </div>
      )}

      {subTab === "plans" && (
        <div className="admin-cms__card">
          <button type="button" className="admin-cms__btn mb-4" onClick={addPlan}>
            + Añadir plan
          </button>
          {plans.map((row, i) => (
            <div key={row.id} className="admin-cms__row">
              <div className="admin-cms__field">
                <label>Nombre del plan</label>
                <input
                  value={row.name}
                  onChange={(e) =>
                    setPlans((prev) =>
                      prev.map((p, j) => (j === i ? { ...p, name: e.target.value } : p))
                    )
                  }
                />
              </div>
              <div className="admin-cms__field">
                <label>Beneficios (uno por línea)</label>
                <textarea
                  value={row.items.join("\n")}
                  onChange={(e) =>
                    setPlans((prev) =>
                      prev.map((p, j) =>
                        j === i
                          ? {
                              ...p,
                              items: e.target.value.split("\n").map((x) => x.trim()),
                            }
                          : p
                      )
                    )
                  }
                />
              </div>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={row.is_featured}
                    onChange={(e) =>
                      setPlans((prev) =>
                        prev.map((p, j) =>
                          j === i ? { ...p, is_featured: e.target.checked } : p
                        )
                      )
                    }
                  />
                  Destacado (recomendado)
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={row.is_published}
                    onChange={(e) =>
                      setPlans((prev) =>
                        prev.map((p, j) =>
                          j === i ? { ...p, is_published: e.target.checked } : p
                        )
                      )
                    }
                  />
                  Publicado
                </label>
              </div>
              <div className="admin-cms__actions">
                <button
                  type="button"
                  className="admin-cms__btn"
                  disabled={saving}
                  onClick={() => savePlan(row)}
                >
                  Guardar
                </button>
                <button
                  type="button"
                  className="admin-cms__btn admin-cms__btn--danger"
                  onClick={() => deletePlan(row.id)}
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {subTab === "articles" && (
        <div className="admin-cms__card">
          <button type="button" className="admin-cms__btn mb-4" onClick={addArticle}>
            + Añadir artículo
          </button>
          {articles.map((row, i) => (
            <div key={row.id} className="admin-cms__row">
              <div className="admin-cms__field">
                <label>Categoría</label>
                <input
                  value={row.category}
                  onChange={(e) =>
                    setArticles((prev) =>
                      prev.map((a, j) => (j === i ? { ...a, category: e.target.value } : a))
                    )
                  }
                />
              </div>
              <div className="admin-cms__field">
                <label>Título</label>
                <input
                  value={row.title}
                  onChange={(e) =>
                    setArticles((prev) =>
                      prev.map((a, j) => (j === i ? { ...a, title: e.target.value } : a))
                    )
                  }
                />
              </div>
              <div className="admin-cms__field">
                <label>Cuerpo (opcional)</label>
                <textarea
                  value={row.body ?? ""}
                  onChange={(e) =>
                    setArticles((prev) =>
                      prev.map((a, j) => (j === i ? { ...a, body: e.target.value } : a))
                    )
                  }
                />
              </div>
              <div className="admin-cms__field">
                <label>URL imagen (opcional)</label>
                <input
                  value={row.image_url ?? ""}
                  onChange={(e) =>
                    setArticles((prev) =>
                      prev.map((a, j) =>
                        j === i ? { ...a, image_url: e.target.value || null } : a
                      )
                    )
                  }
                />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={row.is_published}
                  onChange={(e) =>
                    setArticles((prev) =>
                      prev.map((a, j) =>
                        j === i ? { ...a, is_published: e.target.checked } : a
                      )
                    )
                  }
                />
                Publicado
              </label>
              <div className="admin-cms__actions">
                <button
                  type="button"
                  className="admin-cms__btn"
                  disabled={saving}
                  onClick={() => saveArticle(row)}
                >
                  Guardar
                </button>
                <button
                  type="button"
                  className="admin-cms__btn admin-cms__btn--danger"
                  onClick={() => deleteArticle(row.id)}
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {subTab === "texts" && (
        <div className="admin-cms__card">
          {CMS_TEXT_GROUPS.map((group) => (
            <div key={group.group} className="admin-cms__text-group">
              <h3>{group.group}</h3>
              {group.keys.map((k) => (
                <div key={k.key} className="admin-cms__field mb-3">
                  <label>
                    {k.label}{" "}
                    <span className="text-muted font-normal">({k.key})</span>
                  </label>
                  <textarea
                    rows={2}
                    value={textDraft[k.key] ?? ""}
                    onChange={(e) =>
                      setTextDraft((prev) => ({ ...prev, [k.key]: e.target.value }))
                    }
                  />
                </div>
              ))}
            </div>
          ))}
          <button
            type="button"
            className="admin-cms__btn"
            disabled={saving}
            onClick={saveAllTexts}
          >
            Guardar todos los textos
          </button>
        </div>
      )}
    </section>
  );
}
