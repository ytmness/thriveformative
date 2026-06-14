"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { fetchStoreProducts } from "@/lib/store/fetch";
import { isValidRef, slugifyRef } from "@/lib/store/slug";
import type { Locale, StoreProduct } from "@/lib/store/types";

export type StoreProductDraft = StoreProduct & { id: string | "draft" };

function createEmptyDraft(locale: Locale, sortOrder: number): StoreProductDraft {
  return {
    id: "draft",
    locale,
    sort_order: sortOrder,
    name: "",
    description: "",
    ref: "",
    referral_url: "",
    image_url: null,
    is_published: true,
  };
}

function validateProduct(row: Pick<StoreProduct, "name" | "ref" | "referral_url">): string | null {
  if (!row.name.trim()) return "El nombre es obligatorio.";
  const ref = row.ref.trim();
  if (!ref) return "El ref (slug) es obligatorio.";
  if (!isValidRef(ref)) {
    return "El ref debe usar solo letras minúsculas, números y guiones (ej. vitamina-d).";
  }
  const url = row.referral_url.trim();
  if (!url) return "El enlace de referido es obligatorio.";
  try {
    const parsed = new URL(url);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return "El enlace de referido debe ser http o https.";
    }
  } catch {
    return "El enlace de referido no es una URL válida.";
  }
  return null;
}

export function useStoreAdmin(initialLocale: Locale) {
  const [locale, setLocale] = useState<Locale>(initialLocale);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [draft, setDraft] = useState<StoreProductDraft>(() => createEmptyDraft(initialLocale, 0));
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    setLocale(initialLocale);
  }, [initialLocale]);

  const nextSortOrder = useCallback((rows: StoreProduct[]) => {
    if (!rows.length) return 0;
    return Math.max(...rows.map((p) => p.sort_order)) + 1;
  }, []);

  const resetDraft = useCallback(
    (rows: StoreProduct[] = products) => {
      setDraft(createEmptyDraft(locale, nextSortOrder(rows)));
      setEditingId(null);
    },
    [locale, nextSortOrder, products]
  );

  const load = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    try {
      const rows = await fetchStoreProducts(locale, { includeUnpublished: true });
      setProducts(rows);
      setDraft(createEmptyDraft(locale, nextSortOrder(rows)));
      setEditingId(null);
    } catch (e) {
      setMessage({
        type: "err",
        text:
          e instanceof Error
            ? e.message
            : "No se pudo cargar la tienda. ¿Ejecutaste la migración 012_store_products.sql?",
      });
    } finally {
      setLoading(false);
    }
  }, [locale, nextSortOrder]);

  useEffect(() => {
    load();
  }, [load]);

  function updateDraft(patch: Partial<StoreProductDraft>) {
    setDraft((prev) => ({ ...prev, ...patch }));
  }

  function suggestRefFromName(name: string): string {
    return slugifyRef(name);
  }

  function startNewProduct() {
    setMessage(null);
    resetDraft();
  }

  function startEditProduct(product: StoreProduct) {
    setMessage(null);
    setDraft({ ...product });
    setEditingId(product.id);
  }

  async function saveDraft() {
    const validation = validateProduct(draft);
    if (validation) {
      setMessage({ type: "err", text: validation });
      return false;
    }

    setSaving(true);
    setMessage(null);
    const supabase = createClient();
    const payload = {
      locale,
      sort_order: draft.sort_order,
      name: draft.name.trim(),
      description: draft.description.trim(),
      ref: draft.ref.trim(),
      referral_url: draft.referral_url.trim(),
      image_url: draft.image_url?.trim() || null,
      is_published: draft.is_published,
      updated_at: new Date().toISOString(),
    };

    const isNew = editingId === null;
    const { data, error } = isNew
      ? await supabase.from("store_products").insert(payload).select().single()
      : await supabase
          .from("store_products")
          .update(payload)
          .eq("id", editingId)
          .select()
          .single();

    setSaving(false);

    if (error) {
      setMessage({
        type: "err",
        text: error.message.includes("store_products_locale_ref_key")
          ? "Ya existe un producto con ese ref en este idioma."
          : error.message,
      });
      return false;
    }

    if (data) {
      const saved = data as StoreProduct;
      setProducts((prev) => {
        const next = prev.filter((p) => p.id !== saved.id);
        return [...next, saved].sort((a, b) => a.sort_order - b.sort_order);
      });
      setDraft(createEmptyDraft(locale, nextSortOrder([...products.filter((p) => p.id !== saved.id), saved])));
      setEditingId(null);
    }

    setMessage({
      type: "ok",
      text: isNew ? "Producto añadido. Puedes agregar otro." : "Producto actualizado.",
    });
    return true;
  }

  async function deleteProduct(id: string) {
    setMessage(null);
    const supabase = createClient();
    const { error } = await supabase.from("store_products").delete().eq("id", id);
    if (error) {
      setMessage({ type: "err", text: error.message });
      return false;
    }

    const nextProducts = products.filter((p) => p.id !== id);
    setProducts(nextProducts);
    if (editingId === id) {
      setDraft(createEmptyDraft(locale, nextSortOrder(nextProducts)));
      setEditingId(null);
    }
    setMessage({ type: "ok", text: "Producto eliminado." });
    return true;
  }

  async function togglePublished(id: string) {
    const product = products.find((p) => p.id === id);
    if (!product) return false;

    const next = !product.is_published;
    setSaving(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("store_products")
      .update({ is_published: next, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();
    setSaving(false);

    if (error) {
      setMessage({ type: "err", text: error.message });
      return false;
    }

    if (data) {
      const saved = data as StoreProduct;
      setProducts((prev) =>
        prev.map((p) => (p.id === id ? saved : p)).sort((a, b) => a.sort_order - b.sort_order)
      );
      if (editingId === id) {
        setDraft((prev) => ({ ...prev, is_published: saved.is_published }));
      }
    }
    return true;
  }

  return {
    locale,
    setLocale,
    loading,
    saving,
    message,
    products,
    draft,
    editingId,
    updateDraft,
    load,
    saveDraft,
    deleteProduct,
    togglePublished,
    startNewProduct,
    startEditProduct,
    suggestRefFromName,
  };
}

export type StoreAdminApi = ReturnType<typeof useStoreAdmin>;
