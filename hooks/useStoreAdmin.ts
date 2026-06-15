"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { fetchStoreCategories, fetchStoreProducts } from "@/lib/store/fetch";
import { isValidRef, slugifyRef } from "@/lib/store/slug";
import type { Locale, StoreCategory, StoreProduct } from "@/lib/store/types";

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
    category_id: null,
    category: null,
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

function validateCategoryName(name: string): string | null {
  if (!name.trim()) return "El nombre de la categoría es obligatorio.";
  return null;
}

export function useStoreAdmin(initialLocale: Locale) {
  const [locale, setLocale] = useState<Locale>(initialLocale);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [categories, setCategories] = useState<StoreCategory[]>([]);
  const [draft, setDraft] = useState<StoreProductDraft>(() => createEmptyDraft(initialLocale, 0));
  const [editingId, setEditingId] = useState<string | null>(null);
  const [categoryName, setCategoryName] = useState("");

  useEffect(() => {
    setLocale(initialLocale);
  }, [initialLocale]);

  const nextSortOrder = useCallback((rows: { sort_order: number }[]) => {
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
      const [rows, cats] = await Promise.all([
        fetchStoreProducts(locale, { includeUnpublished: true }),
        fetchStoreCategories(locale),
      ]);
      setProducts(rows);
      setCategories(cats);
      setDraft(createEmptyDraft(locale, nextSortOrder(rows)));
      setEditingId(null);
      setCategoryName("");
    } catch (e) {
      setMessage({
        type: "err",
        text:
          e instanceof Error
            ? e.message
            : "No se pudo cargar la tienda. ¿Ejecutaste las migraciones 012 y 013?",
      });
    } finally {
      setLoading(false);
    }
  }, [locale, nextSortOrder]);

  useEffect(() => {
    load();
  }, [load]);

  function updateDraft(patch: Partial<StoreProductDraft>) {
    setDraft((prev) => {
      const next = { ...prev, ...patch };
      if ("category_id" in patch) {
        next.category =
          patch.category_id == null
            ? null
            : categories.find((c) => c.id === patch.category_id) ?? null;
      }
      return next;
    });
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
      category_id: draft.category_id || null,
      is_published: draft.is_published,
      updated_at: new Date().toISOString(),
    };

    const isNew = editingId === null;
    const { data, error } = isNew
      ? await supabase.from("store_products").insert(payload).select(PRODUCT_SELECT).single()
      : await supabase
          .from("store_products")
          .update(payload)
          .eq("id", editingId)
          .select(PRODUCT_SELECT)
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
      const saved = mapProductFromDb(data);
      const nextProducts = [...products.filter((p) => p.id !== saved.id), saved].sort(
        (a, b) => a.sort_order - b.sort_order
      );
      setProducts(nextProducts);
      setDraft(createEmptyDraft(locale, nextSortOrder(nextProducts)));
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
      .select(PRODUCT_SELECT)
      .single();
    setSaving(false);

    if (error) {
      setMessage({ type: "err", text: error.message });
      return false;
    }

    if (data) {
      const saved = mapProductFromDb(data);
      setProducts((prev) =>
        prev.map((p) => (p.id === id ? saved : p)).sort((a, b) => a.sort_order - b.sort_order)
      );
      if (editingId === id) {
        setDraft((prev) => ({ ...prev, is_published: saved.is_published }));
      }
    }
    return true;
  }

  async function addCategory() {
    const validation = validateCategoryName(categoryName);
    if (validation) {
      setMessage({ type: "err", text: validation });
      return false;
    }

    setSaving(true);
    setMessage(null);
    const supabase = createClient();
    const slug = slugifyRef(categoryName);
    if (!slug) {
      setSaving(false);
      setMessage({ type: "err", text: "No se pudo generar un slug válido para la categoría." });
      return false;
    }

    const { data, error } = await supabase
      .from("store_categories")
      .insert({
        locale,
        name: categoryName.trim(),
        slug,
        sort_order: nextSortOrder(categories),
        updated_at: new Date().toISOString(),
      })
      .select("id, locale, name, slug, sort_order")
      .single();

    setSaving(false);

    if (error) {
      setMessage({
        type: "err",
        text: error.message.includes("store_categories_locale_slug_key")
          ? "Ya existe una categoría con ese nombre/slug."
          : error.message,
      });
      return false;
    }

    if (data) {
      setCategories((prev) =>
        [...prev, data as StoreCategory].sort((a, b) => a.sort_order - b.sort_order)
      );
      setCategoryName("");
    }
    setMessage({ type: "ok", text: "Categoría añadida." });
    return true;
  }

  async function deleteCategory(id: string) {
    setMessage(null);
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.from("store_categories").delete().eq("id", id);
    setSaving(false);

    if (error) {
      setMessage({ type: "err", text: error.message });
      return false;
    }

    setCategories((prev) => prev.filter((c) => c.id !== id));
    setProducts((prev) =>
      prev.map((p) =>
        p.category_id === id ? { ...p, category_id: null, category: null } : p
      )
    );
    if (draft.category_id === id) {
      updateDraft({ category_id: null, category: null });
    }
    setMessage({ type: "ok", text: "Categoría eliminada." });
    return true;
  }

  return {
    locale,
    setLocale,
    loading,
    saving,
    message,
    products,
    categories,
    draft,
    editingId,
    categoryName,
    setCategoryName,
    updateDraft,
    load,
    saveDraft,
    deleteProduct,
    deleteCategory,
    addCategory,
    togglePublished,
    startNewProduct,
    startEditProduct,
    suggestRefFromName,
  };
}

const PRODUCT_SELECT = `
  id,
  locale,
  sort_order,
  name,
  description,
  ref,
  referral_url,
  image_url,
  category_id,
  is_published,
  store_categories (
    id,
    locale,
    name,
    slug,
    sort_order
  )
`;

function mapProductFromDb(row: Record<string, unknown>): StoreProduct {
  const rawCat = row.store_categories as StoreCategory | StoreCategory[] | null;
  const category = Array.isArray(rawCat) ? rawCat[0] ?? null : rawCat;
  return {
    id: row.id as string,
    locale: row.locale as string,
    sort_order: row.sort_order as number,
    name: row.name as string,
    description: (row.description as string) ?? "",
    ref: row.ref as string,
    referral_url: row.referral_url as string,
    image_url: (row.image_url as string | null) ?? null,
    category_id: (row.category_id as string | null) ?? null,
    category,
    is_published: row.is_published as boolean,
  };
}

export type StoreAdminApi = ReturnType<typeof useStoreAdmin>;
