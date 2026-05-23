"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase";
import { fetchCmsBundle } from "@/lib/cms/fetch";
import { CMS_TEXT_GROUPS } from "@/lib/cms/textKeys";
import type { CmsArticle, CmsPlan, CmsService, Locale } from "@/lib/cms/types";

export function useCmsAdmin() {
  const t = useTranslations();
  const [locale, setLocale] = useState<Locale>("es");
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
        text:
          e instanceof Error
            ? e.message
            : "No se pudo cargar el CMS. ¿Ejecutaste la migración 010_cms.sql?",
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
      return false;
    }
    setMessage({ type: "ok", text: "Servicio guardado." });
    await load();
    return true;
  }

  async function deleteService(id: string) {
    if (id.startsWith("new-")) {
      setServices((prev) => prev.filter((s) => s.id !== id));
      return true;
    }
    const supabase = createClient();
    const { error } = await supabase.from("cms_services").delete().eq("id", id);
    if (error) {
      setMessage({ type: "err", text: error.message });
      return false;
    }
    await load();
    return true;
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
      return false;
    }
    setMessage({ type: "ok", text: "Plan guardado." });
    await load();
    return true;
  }

  async function deletePlan(id: string) {
    if (id.startsWith("new-")) {
      setPlans((prev) => prev.filter((p) => p.id !== id));
      return true;
    }
    const supabase = createClient();
    const { error } = await supabase.from("cms_plans").delete().eq("id", id);
    if (error) {
      setMessage({ type: "err", text: error.message });
      return false;
    }
    await load();
    return true;
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
      return false;
    }
    setMessage({ type: "ok", text: "Artículo guardado." });
    await load();
    return true;
  }

  async function deleteArticle(id: string) {
    if (id.startsWith("new-")) {
      setArticles((prev) => prev.filter((a) => a.id !== id));
      return true;
    }
    const supabase = createClient();
    const { error } = await supabase.from("cms_articles").delete().eq("id", id);
    if (error) {
      setMessage({ type: "err", text: error.message });
      return false;
    }
    await load();
    return true;
  }

  async function saveTextKeys(keys: string[]) {
    setSaving(true);
    setMessage(null);
    const supabase = createClient();
    for (const content_key of keys) {
      const value = (textDraft[content_key] ?? "").trim();
      if (!value) continue;
      const { error } = await supabase.from("cms_text_entries").upsert(
        {
          locale,
          content_key,
          value,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "locale,content_key" }
      );
      if (error) {
        setSaving(false);
        setMessage({ type: "err", text: error.message });
        return false;
      }
    }
    setSaving(false);
    setMessage({ type: "ok", text: "Texto guardado." });
    await load();
    return true;
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
        return false;
      }
    }
    setSaving(false);
    setMessage({ type: "ok", text: "Textos guardados." });
    await load();
    return true;
  }

  function addService(prefill?: Pick<CmsService, "name" | "description">) {
    const id = `new-${Date.now()}`;
    setServices((prev) => [
      ...prev,
      {
        id,
        locale,
        sort_order: prev.length,
        name: prefill?.name ?? "",
        description: prefill?.description ?? "",
        is_published: true,
      },
    ]);
    return id;
  }

  function addPlan(prefill?: Pick<CmsPlan, "name" | "items" | "is_featured">) {
    const id = `new-${Date.now()}`;
    setPlans((prev) => [
      ...prev,
      {
        id,
        locale,
        sort_order: prev.length,
        name: prefill?.name ?? "",
        items: prefill?.items ?? [],
        is_featured: prefill?.is_featured ?? false,
        is_published: true,
      },
    ]);
    return id;
  }

  function addArticle() {
    const id = `new-${Date.now()}`;
    setArticles((prev) => [
      ...prev,
      {
        id,
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
    return id;
  }

  function updateTextDraft(key: string, value: string) {
    setTextDraft((prev) => ({ ...prev, [key]: value }));
  }

  function getServiceById(id: string) {
    return services.find((s) => s.id === id);
  }

  function getPlanById(id: string) {
    return plans.find((p) => p.id === id);
  }

  function getArticleById(id: string) {
    return articles.find((a) => a.id === id);
  }

  function updateService(id: string, patch: Partial<CmsService>) {
    setServices((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }

  function updatePlan(id: string, patch: Partial<CmsPlan>) {
    setPlans((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  }

  function updateArticle(id: string, patch: Partial<CmsArticle>) {
    setArticles((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch } : a)));
  }

  return {
    locale,
    setLocale,
    loading,
    saving,
    message,
    setMessage,
    services,
    setServices,
    plans,
    setPlans,
    articles,
    setArticles,
    textDraft,
    updateTextDraft,
    load,
    saveService,
    deleteService,
    savePlan,
    deletePlan,
    saveArticle,
    deleteArticle,
    saveTextKeys,
    saveAllTexts,
    addService,
    addPlan,
    addArticle,
    getServiceById,
    getPlanById,
    getArticleById,
    updateService,
    updatePlan,
    updateArticle,
  };
}

export type CmsAdminApi = ReturnType<typeof useCmsAdmin>;
