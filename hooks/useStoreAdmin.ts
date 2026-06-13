"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { fetchStoreProducts } from "@/lib/store/fetch";
import { isValidRef, slugifyRef } from "@/lib/store/slug";
import type { Locale, StoreProduct } from "@/lib/store/types";

function mergeWithPendingDrafts(loaded: StoreProduct[], pending: StoreProduct[]): StoreProduct[] {
  const loadedIds = new Set(loaded.map((x) => x.id));
  const extra = pending.filter((x) => x.id.startsWith("new-") && !loadedIds.has(x.id));
  return [...loaded, ...extra];
}

function validateProduct(row: StoreProduct): string | null {
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

  useEffect(() => {
    setLocale(initialLocale);
  }, [initialLocale]);

  const load = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    try {
      const rows = await fetchStoreProducts(locale, { includeUnpublished: true });
      setProducts((prev) => mergeWithPendingDrafts(rows, prev));
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
  }, [locale]);

  useEffect(() => {
    load();
  }, [load]);

  async function saveProduct(row: StoreProduct) {
    const validation = validateProduct(row);
    if (validation) {
      setMessage({ type: "err", text: validation });
      return false;
    }

    setSaving(true);
    const supabase = createClient();
    const payload = {
      locale,
      sort_order: row.sort_order,
      name: row.name.trim(),
      description: row.description.trim(),
      ref: row.ref.trim(),
      referral_url: row.referral_url.trim(),
      image_url: row.image_url?.trim() || null,
      is_published: row.is_published,
      updated_at: new Date().toISOString(),
    };
    const isNew = row.id.startsWith("new-");
    const { data, error } = isNew
      ? await supabase.from("store_products").insert(payload).select().single()
      : await supabase
          .from("store_products")
          .update(payload)
          .eq("id", row.id)
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
      setProducts((prev) => {
        const next = prev.filter((p) => p.id !== row.id);
        return [...next, data as StoreProduct].sort((a, b) => a.sort_order - b.sort_order);
      });
    }
    setMessage({ type: "ok", text: "Producto guardado." });
    return true;
  }

  async function deleteProduct(id: string) {
    if (id.startsWith("new-")) {
      setProducts((prev) => prev.filter((p) => p.id !== id));
      return true;
    }
    const supabase = createClient();
    const { error } = await supabase.from("store_products").delete().eq("id", id);
    if (error) {
      setMessage({ type: "err", text: error.message });
      return false;
    }
    setProducts((prev) => prev.filter((p) => p.id !== id));
    return true;
  }

  function nextSortOrder() {
    if (!products.length) return 0;
    return Math.max(...products.map((p) => p.sort_order)) + 1;
  }

  function addProduct() {
    const id = `new-${Date.now()}`;
    setProducts((prev) => [
      ...prev,
      {
        id,
        locale,
        sort_order: nextSortOrder(),
        name: "",
        description: "",
        ref: "",
        referral_url: "",
        image_url: null,
        is_published: true,
      },
    ]);
    return id;
  }

  function suggestRefFromName(name: string): string {
    return slugifyRef(name);
  }

  return {
    locale,
    setLocale,
    loading,
    saving,
    message,
    products,
    setProducts,
    load,
    saveProduct,
    deleteProduct,
    addProduct,
    suggestRefFromName,
  };
}

export type StoreAdminApi = ReturnType<typeof useStoreAdmin>;
