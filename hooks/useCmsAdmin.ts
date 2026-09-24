"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { fetchCmsBundle } from "@/lib/cms/fetch";
import { mutateCms } from "@/lib/cms/mutateClient";
import { CMS_TEXT_GROUPS } from "@/lib/cms/textKeys";
import { isEphemeralCmsId } from "@/lib/cms/resolveDisplay";
import type { CmsArticle, CmsPlan, CmsService, Locale } from "@/lib/cms/types";

function mergeWithPendingDrafts<T extends { id: string }>(loaded: T[], pending: T[]): T[] {
  const loadedIds = new Set(loaded.map((x) => x.id));
  const extra = pending.filter((x) => x.id.startsWith("new-") && !loadedIds.has(x.id));
  return [...loaded, ...extra];
}

export function useCmsAdmin(initialLocale: Locale) {
  const t = useTranslations();
  const [locale, setLocale] = useState<Locale>(initialLocale);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const [services, setServices] = useState<CmsService[]>([]);
  const [plans, setPlans] = useState<CmsPlan[]>([]);
  const [articles, setArticles] = useState<CmsArticle[]>([]);
  const [textDraft, setTextDraft] = useState<Record<string, string>>({});

  useEffect(() => {
    setLocale(initialLocale);
  }, [initialLocale]);

  const load = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    try {
      const bundle = await fetchCmsBundle(locale, { includeUnpublished: true });
      setServices((prev) => mergeWithPendingDrafts(bundle.services, prev));
      setPlans((prev) => mergeWithPendingDrafts(bundle.plans, prev));
      setArticles((prev) => mergeWithPendingDrafts(bundle.articles, prev));
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
    const payload = {
      locale,
      sort_order: row.sort_order,
      name: row.name.trim(),
      description: row.description.trim(),
      is_published: row.is_published,
    };
    const isNew = row.id.startsWith("new-");
    try {
      const { data } = await mutateCms<{ data: CmsService }>({
        op: "saveService",
        id: isNew ? undefined : row.id,
        payload,
      });
      setServices((prev) => {
        const next = prev.filter((s) => s.id !== row.id);
        return [...next, data].sort((a, b) => a.sort_order - b.sort_order);
      });
      setMessage({ type: "ok", text: "Servicio guardado." });
      return true;
    } catch (e) {
      setMessage({ type: "err", text: e instanceof Error ? e.message : "Error" });
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function deleteService(id: string) {
    if (isEphemeralCmsId(id)) {
      if (id.startsWith("new-")) {
        setServices((prev) => prev.filter((s) => s.id !== id));
      }
      return true;
    }
    try {
      await mutateCms({ op: "deleteService", id });
      setServices((prev) => prev.filter((s) => s.id !== id));
      return true;
    } catch (e) {
      setMessage({ type: "err", text: e instanceof Error ? e.message : "Error" });
      return false;
    }
  }

  async function savePlan(row: CmsPlan) {
    setSaving(true);
    const payload = {
      locale,
      sort_order: row.sort_order,
      name: row.name.trim(),
      items: row.items.filter((x) => x.trim()),
      is_featured: row.is_featured,
      is_published: row.is_published,
    };
    const isNew = row.id.startsWith("new-");
    try {
      const { data } = await mutateCms<{ data: CmsPlan }>({
        op: "savePlan",
        id: isNew ? undefined : row.id,
        payload,
      });
      const parsed: CmsPlan = {
        ...data,
        items: Array.isArray(data.items)
          ? data.items.filter((x): x is string => typeof x === "string")
          : row.items.filter((x) => x.trim()),
      };
      setPlans((prev) => {
        const next = prev.filter((p) => p.id !== row.id);
        return [...next, parsed].sort((a, b) => a.sort_order - b.sort_order);
      });
      setMessage({ type: "ok", text: "Plan guardado." });
      return true;
    } catch (e) {
      setMessage({ type: "err", text: e instanceof Error ? e.message : "Error" });
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function deletePlan(id: string) {
    if (isEphemeralCmsId(id)) {
      if (id.startsWith("new-")) {
        setPlans((prev) => prev.filter((p) => p.id !== id));
      }
      return true;
    }
    try {
      await mutateCms({ op: "deletePlan", id });
      setPlans((prev) => prev.filter((p) => p.id !== id));
      return true;
    } catch (e) {
      setMessage({ type: "err", text: e instanceof Error ? e.message : "Error" });
      return false;
    }
  }

  async function saveArticle(row: CmsArticle) {
    setSaving(true);
    const payload = {
      locale,
      sort_order: row.sort_order,
      category: row.category.trim(),
      title: row.title.trim(),
      body: row.body?.trim() || null,
      image_url: row.image_url?.trim() || null,
      is_published: row.is_published,
      published_at: row.published_at || new Date().toISOString().slice(0, 10),
    };
    const isNew = row.id.startsWith("new-");
    try {
      const { data } = await mutateCms<{ data: CmsArticle }>({
        op: "saveArticle",
        id: isNew ? undefined : row.id,
        payload,
      });
      setArticles((prev) => {
        const next = prev.filter((a) => a.id !== row.id);
        return [...next, data].sort((a, b) => a.sort_order - b.sort_order);
      });
      setMessage({ type: "ok", text: "Artículo guardado." });
      return true;
    } catch (e) {
      setMessage({ type: "err", text: e instanceof Error ? e.message : "Error" });
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function deleteArticle(id: string) {
    if (isEphemeralCmsId(id)) {
      if (id.startsWith("new-")) {
        setArticles((prev) => prev.filter((a) => a.id !== id));
      }
      return true;
    }
    try {
      await mutateCms({ op: "deleteArticle", id });
      setArticles((prev) => prev.filter((a) => a.id !== id));
      return true;
    } catch (e) {
      setMessage({ type: "err", text: e instanceof Error ? e.message : "Error" });
      return false;
    }
  }

  async function saveTextKeys(keys: string[]) {
    setSaving(true);
    setMessage(null);
    try {
      const rows = keys
        .map((content_key) => ({
          content_key,
          value: (textDraft[content_key] ?? "").trim(),
        }))
        .filter((r) => r.value.length > 0);
      await mutateCms({ op: "upsertTexts", locale, rows });
      setMessage({ type: "ok", text: "Texto guardado." });
      await load();
      return true;
    } catch (e) {
      setMessage({ type: "err", text: e instanceof Error ? e.message : "Error" });
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function saveAllTexts() {
    setSaving(true);
    setMessage(null);
    try {
      const rows = Object.entries(textDraft)
        .filter(([, v]) => v.trim().length > 0)
        .map(([content_key, value]) => ({
          content_key,
          value: value.trim(),
        }));
      await mutateCms({ op: "upsertTexts", locale, rows });
      setMessage({ type: "ok", text: "Textos guardados." });
      await load();
      return true;
    } catch (e) {
      setMessage({ type: "err", text: e instanceof Error ? e.message : "Error" });
      return false;
    } finally {
      setSaving(false);
    }
  }

  function nextSortOrder<T extends { sort_order: number }>(items: T[]) {
    if (!items.length) return 0;
    return Math.max(...items.map((i) => i.sort_order)) + 1;
  }

  function addService(
    prefill?: Partial<Pick<CmsService, "name" | "description" | "sort_order">>
  ) {
    const id = `new-${Date.now()}`;
    setServices((prev) => [
      ...prev,
      {
        id,
        locale,
        sort_order: prefill?.sort_order ?? nextSortOrder(prev),
        name: prefill?.name ?? "",
        description: prefill?.description ?? "",
        is_published: true,
      },
    ]);
    return id;
  }

  function addPlan(
    prefill?: Partial<Pick<CmsPlan, "name" | "items" | "is_featured" | "sort_order">>
  ) {
    const id = `new-${Date.now()}`;
    setPlans((prev) => [
      ...prev,
      {
        id,
        locale,
        sort_order: prefill?.sort_order ?? nextSortOrder(prev),
        name: prefill?.name ?? "",
        items: prefill?.items ?? [],
        is_featured: prefill?.is_featured ?? false,
        is_published: true,
      },
    ]);
    return id;
  }

  function addArticle(prefill?: Partial<Pick<CmsArticle, "category" | "title" | "sort_order">>) {
    const id = `new-${Date.now()}`;
    setArticles((prev) => [
      ...prev,
      {
        id,
        locale,
        sort_order: prefill?.sort_order ?? nextSortOrder(prev),
        category: prefill?.category ?? "",
        title: prefill?.title ?? "",
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

  async function toggleServiceVisibility(id: string) {
    if (isEphemeralCmsId(id)) return;
    const row = getServiceById(id);
    if (!row) return;
    const next = !row.is_published;
    updateService(id, { is_published: next });
    await saveService({ ...row, is_published: next });
  }

  async function togglePlanVisibility(id: string) {
    if (isEphemeralCmsId(id)) return;
    const row = getPlanById(id);
    if (!row) return;
    const next = !row.is_published;
    updatePlan(id, { is_published: next });
    await savePlan({ ...row, is_published: next });
  }

  async function toggleArticleVisibility(id: string) {
    if (isEphemeralCmsId(id)) return;
    const row = getArticleById(id);
    if (!row) return;
    const next = !row.is_published;
    updateArticle(id, { is_published: next });
    await saveArticle({ ...row, is_published: next });
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
    toggleServiceVisibility,
    togglePlanVisibility,
    toggleArticleVisibility,
  };
}

export type CmsAdminApi = ReturnType<typeof useCmsAdmin>;
