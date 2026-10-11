"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchStoreCategories, fetchStoreProducts } from "@/lib/store/fetch";
import { productImageList } from "@/lib/store/images";
import { isValidRef, slugifyRef } from "@/lib/store/slug";
import type { Locale, StoreCategory, StoreProduct } from "@/lib/store/types";

async function mutateStore<T = unknown>(body: Record<string, unknown>): Promise<T> {
  const res = await fetch("/api/store/mutate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error || `Error ${res.status}`);
  return data as T;
}

export type StoreProductDraft = StoreProduct & { id: string | "draft" };

function createEmptyDraft(locale: Locale, sortOrder: number, country: string): StoreProductDraft {
  return {
    id: "draft",
    locale,
    country,
    sort_order: sortOrder,
    name: "",
    description: "",
    ref: "",
    referral_url: "",
    image_url: null,
    image_urls: [],
    category_id: null,
    category: null,
    is_published: true,
    price_min: null,
    price_max: null,
    compare_at_price_min: null,
    currency: country === "US" ? "USD" : "MXN",
    source: null,
    source_handle: null,
  };
}

function validateProduct(row: Pick<StoreProduct, "name" | "ref" | "referral_url" | "price_min">, english: boolean): string | null {
  if (!row.name.trim()) return english ? "The name is required." : "El nombre es obligatorio.";
  const ref = row.ref.trim();
  if (!ref) return english ? "The product link could not be built from the name." : "No se pudo armar el enlace del producto a partir del nombre.";
  if (!isValidRef(ref)) {
    return english ? "The name needs letters or numbers to build the link." : "El nombre necesita letras o números para armar el enlace.";
  }
  const url = row.referral_url.trim();
  const hasPrice = row.price_min != null && Number(row.price_min) > 0;
  if (url && hasPrice) {
    return english ? "Set a price to sell it here, or a link to redirect. Not both." : "Pon el precio para venderlo aquí, o el enlace para redirigir. No los dos.";
  }
  if (url) {
    try {
      const parsed = new URL(url);
      if (!["http:", "https:"].includes(parsed.protocol)) {
        return english ? "The referral link must be http or https." : "El enlace de referido debe ser http o https.";
      }
    } catch {
      return english ? "The referral link is not a valid URL." : "El enlace de referido no es una URL válida.";
    }
    return null;
  }
  if (row.price_min == null || Number(row.price_min) <= 0) {
    return english ? "Set a price to sell it here, or a link if you only want to redirect." : "Pon un precio para venderlo aquí, o un enlace si solo quieres redirigir.";
  }
  return null;
}

function validateCategoryName(name: string, english: boolean): string | null {
  if (!name.trim()) return english ? "The category name is required." : "El nombre de la categoría es obligatorio.";
  return null;
}

export function useStoreAdmin(initialLocale: Locale, country: string) {
  const english = country === "US";
  const [locale, setLocale] = useState<Locale>(initialLocale);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [categories, setCategories] = useState<StoreCategory[]>([]);
  const [draft, setDraft] = useState<StoreProductDraft>(() => createEmptyDraft(initialLocale, 0, country));
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
      setDraft(createEmptyDraft(locale, nextSortOrder(rows), country));
      setEditingId(null);
    },
    [locale, country, nextSortOrder, products]
  );

  const load = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    try {
      const [rows, cats] = await Promise.all([
        fetchStoreProducts(locale, { includeUnpublished: true, country }),
        fetchStoreCategories(locale, country),
      ]);
      setProducts(rows);
      setCategories(cats);
      setDraft(createEmptyDraft(locale, nextSortOrder(rows), country));
      setEditingId(null);
      setCategoryName("");
    } catch (e) {
      setMessage({
        type: "err",
        text:
          e instanceof Error
            ? e.message
            : english ? "The store could not be loaded." : "No se pudo cargar la tienda. ¿Ejecutaste las migraciones 012 y 013?",
      });
    } finally {
      setLoading(false);
    }
  }, [locale, country, nextSortOrder]);

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
    const image_urls = productImageList(product);
    setDraft({ ...product, image_urls, image_url: image_urls[0] ?? null });
    setEditingId(product.id);
  }

  async function saveDraft() {
    const referral = draft.referral_url.trim();
    const selling = !referral && draft.price_min != null && Number(draft.price_min) > 0;
    const ref = editingId === null ? slugifyRef(draft.name) : draft.ref.trim();
    const ready = { ...draft, ref, referral_url: referral };
    const validation = validateProduct(ready, english);
    if (validation) {
      setMessage({ type: "err", text: validation });
      return false;
    }

    setSaving(true);
    setMessage(null);
    const payload = {
      locale,
      country,
      sort_order: draft.sort_order,
      name: draft.name.trim(),
      description: draft.description.trim(),
      ref,
      referral_url: selling ? "" : referral,
      image_urls: productImageList(draft),
      image_url: productImageList(draft)[0] ?? null,
      category_id: draft.category_id || null,
      is_published: draft.is_published,
      price_min: selling ? Number(draft.price_min) : null,
      price_max: selling ? Number(draft.price_min) : null,
      compare_at_price_min: null,
      currency: country === "US" ? "USD" : draft.currency?.trim() || "MXN",
      source: draft.source?.trim() || null,
      source_handle: draft.source_handle?.trim() || null,
    };

    const isNew = editingId === null;
    try {
      const { data, squareWarning } = await mutateStore<{ data: StoreProduct; squareWarning?: string | null }>({
        op: "saveProduct",
        id: isNew ? undefined : editingId,
        payload,
      });
      const nextProducts = [...products.filter((p) => p.id !== data.id), data].sort(
        (a, b) => a.sort_order - b.sort_order
      );
      setProducts(nextProducts);
      setDraft(createEmptyDraft(locale, nextSortOrder(nextProducts), country));
      setEditingId(null);
      setMessage({
        type: squareWarning ? "err" : "ok",
        text: squareWarning
          ? (english ? `Saved in the store, but Square did not receive it: ${squareWarning}` : `Se guardó en la tienda, pero Square no lo recibió: ${squareWarning}`)
          : isNew
            ? (english ? "Product added. You can add another." : "Producto añadido. Puedes agregar otro.")
            : (english ? "Product updated." : "Producto actualizado."),
      });
      return true;
    } catch (e) {
      setMessage({ type: "err", text: e instanceof Error ? e.message : "Error" });
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function deleteProduct(id: string) {
    setMessage(null);
    try {
      await mutateStore({ op: "deleteProduct", id });
      setProducts((current) => current.filter((p) => p.id !== id));
      if (editingId === id) {
        setDraft(createEmptyDraft(locale, 0, country));
        setEditingId(null);
      }
      setMessage({ type: "ok", text: english ? "Product deleted." : "Producto eliminado." });
      return true;
    } catch (e) {
      setMessage({ type: "err", text: e instanceof Error ? e.message : "Error" });
      return false;
    }
  }

  async function togglePublished(id: string) {
    const product = products.find((p) => p.id === id);
    if (!product) return false;

    setSaving(true);
    try {
      const { data } = await mutateStore<{ data: StoreProduct }>({
        op: "toggleProduct",
        id,
        locale,
      });
      setProducts((prev) =>
        prev.map((p) => (p.id === id ? data : p)).sort((a, b) => a.sort_order - b.sort_order)
      );
      if (editingId === id) {
        setDraft((prev) => ({ ...prev, is_published: data.is_published }));
      }
      return true;
    } catch (e) {
      setMessage({ type: "err", text: e instanceof Error ? e.message : "Error" });
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function addCategory() {
    const validation = validateCategoryName(categoryName, english);
    if (validation) {
      setMessage({ type: "err", text: validation });
      return false;
    }

    setSaving(true);
    setMessage(null);
    const slug = slugifyRef(categoryName);
    if (!slug) {
      setSaving(false);
      setMessage({ type: "err", text: english ? "Could not build a valid category slug." : "No se pudo generar un slug válido para la categoría." });
      return false;
    }

    try {
      const { data } = await mutateStore<{ data: StoreCategory }>({
        op: "saveCategory",
        locale,
        country,
        name: categoryName.trim(),
      });
      setCategories((prev) =>
        [...prev, data].sort((a, b) => a.sort_order - b.sort_order)
      );
      setDraft((prev) => ({ ...prev, category_id: data.id, category: data }));
      setCategoryName("");
      setMessage({ type: "ok", text: english ? "Category added." : "Categoría añadida." });
      return true;
    } catch (e) {
      setMessage({ type: "err", text: e instanceof Error ? e.message : "Error" });
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function renameCategory(id: string, name: string) {
    const validation = validateCategoryName(name, english);
    if (validation) {
      setMessage({ type: "err", text: validation });
      return false;
    }
    setSaving(true);
    setMessage(null);
    try {
      const { data } = await mutateStore<{ data: StoreCategory }>({
        op: "saveCategory",
        id,
        locale,
        name: name.trim(),
      });
      setCategories((prev) =>
        prev.map((cat) => (cat.id === id ? data : cat)).sort((a, b) => a.sort_order - b.sort_order)
      );
      setMessage({ type: "ok", text: english ? "Category updated." : "Categoría actualizada." });
      return true;
    } catch (e) {
      setMessage({ type: "err", text: e instanceof Error ? e.message : "Error" });
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function deleteCategory(id: string) {
    setMessage(null);
    setSaving(true);
    try {
      await mutateStore({ op: "deleteCategory", id });
      setCategories((prev) => prev.filter((c) => c.id !== id));
      setProducts((prev) =>
        prev.map((p) =>
          p.category_id === id ? { ...p, category_id: null, category: null } : p
        )
      );
      if (draft.category_id === id) {
        updateDraft({ category_id: null, category: null });
      }
      setMessage({ type: "ok", text: english ? "Category deleted." : "Categoría eliminada." });
      return true;
    } catch (e) {
      setMessage({ type: "err", text: e instanceof Error ? e.message : "Error" });
      return false;
    } finally {
      setSaving(false);
    }
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
    renameCategory,
    addCategory,
    togglePublished,
    startNewProduct,
    startEditProduct,
    suggestRefFromName,
  };
}


export type StoreAdminApi = ReturnType<typeof useStoreAdmin>;
