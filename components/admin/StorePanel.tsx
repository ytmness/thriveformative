"use client";

import { CMS_LOCALES, type Locale } from "@/lib/cms/types";
import { useEffect, useState } from "react";
import { useClinicScope } from "@/components/admin/clinic/ClinicScope";
import { useStoreAdmin } from "@/hooks/useStoreAdmin";
import CmsImageField from "@/components/admin/cms/CmsImageField";
import "@/app/styles/admin-cms.css";

const LOCALE_LABELS: Record<Locale, string> = {
  es: "Español",
  en: "English",
  ko: "한국어",
  it: "Italiano",
};

type Props = {
  siteLocale: string;
};

export default function StorePanel({ siteLocale }: Props) {
  const scope = useClinicScope();
  const {
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
    saveDraft,
    deleteProduct,
    deleteCategory,
    renameCategory,
    addCategory,
    togglePublished,
    startNewProduct,
    startEditProduct,
    suggestRefFromName,
  } = useStoreAdmin(siteLocale as Locale, scope.country);
  const [editingCat, setEditingCat] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  if (loading) {
    return <div className="mt-10 animate-pulse h-48 bg-surface rounded-2xl border border-theme" />;
  }

  const isEditing = editingId !== null;

  return (
    <section className="admin-cms" aria-label="Tienda web">
      <header className="admin-header">
        <p className="admin-header__eyebrow">Catálogo · {scope.label}</p>
        <h1 className="admin-header__title">Tienda web</h1>
        <p className="admin-header__desc">
          Lo que se vende en el sitio. Con precio y sin enlace, se cobra aquí. Con enlace de referido, solo redirige.
          En Estados Unidos el precio se publica en Square al guardar.
        </p>
      </header>
      <div className="admin-cms__toolbar">
        <div className="admin-cms__locale-select">
          <label htmlFor="store-locale">Idioma a editar</label>
          <select
            id="store-locale"
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
        <p className="text-sm text-muted max-w-xl">
          Si pones precio y no hay enlace, se vende aquí. Si pones un enlace y dejas el precio vacío, solo redirige.
        </p>
      </div>

      {message && (
        <div className={`admin-cms__msg admin-cms__msg--${message.type}`}>{message.text}</div>
      )}

      <div className="admin-cms__card" data-tour="store-cats">
        <h2 className="text-lg font-semibold mb-4">Categorías ({categories.length})</h2>

        <div className="flex flex-wrap gap-2 mb-4">
          <input
            className="flex-1 min-w-[12rem] rounded-xl border border-theme bg-[rgb(var(--bg)/0.35)] px-3 py-2 text-sm"
            value={categoryName}
            placeholder="Nueva categoría (ej. Suplementos)"
            onChange={(e) => setCategoryName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void addCategory();
              }
            }}
          />
          <button
            type="button"
            className="admin-cms__btn"
            disabled={saving || !categoryName.trim()}
            onClick={() => void addCategory()}
          >
            Añadir categoría
          </button>
        </div>

        {categories.length === 0 ? (
          <p className="text-muted text-sm">Sin categorías. Los productos pueden quedar sin categoría.</p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <li
                key={cat.id}
                className="inline-flex items-center gap-2 rounded-full border border-theme bg-[rgb(var(--bg)/0.35)] px-3 py-1.5 text-sm"
              >
                {editingCat === cat.id ? (
                  <input
                    className="rounded-lg border border-theme bg-transparent px-2 py-0.5 text-sm"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        void renameCategory(cat.id, editingName).then((ok) => { if (ok) setEditingCat(null); });
                      }
                    }}
                  />
                ) : (
                  <span>{cat.name}</span>
                )}
                <span className="text-muted text-xs">/{cat.slug}</span>
                <button
                  type="button"
                  className="text-xs font-medium"
                  disabled={saving}
                  onClick={() => {
                    if (editingCat === cat.id) {
                      void renameCategory(cat.id, editingName).then((ok) => { if (ok) setEditingCat(null); });
                      return;
                    }
                    setEditingCat(cat.id);
                    setEditingName(cat.name);
                  }}
                >
                  {editingCat === cat.id ? "Guardar" : "Editar"}
                </button>
                <button
                  type="button"
                  className="text-red-600 hover:opacity-80 text-xs font-medium ml-1"
                  disabled={saving}
                  onClick={() => {
                    if (window.confirm(`¿Eliminar categoría "${cat.name}"? Los productos quedarán sin categoría.`)) {
                      void deleteCategory(cat.id);
                    }
                  }}
                >
                  Eliminar
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="store-composer-wrap mt-6" data-tour="store-form">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h2 className="admin-header__title" style={{ fontSize: "1.65rem" }}>
            {isEditing ? "Editar producto" : "Crear producto"}
          </h2>
          {isEditing ? (
            <button type="button" className="admin-cms__btn admin-cms__btn--ghost" onClick={startNewProduct}>
              Cancelar edición
            </button>
          ) : null}
        </div>

        <ProductForm
          locale={locale}
          country={scope.country}
          draft={draft}
          categories={categories}
          saving={saving}
          isEditing={isEditing}
          onChange={updateDraft}
          onSave={() => void saveDraft()}
          suggestRefFromName={suggestRefFromName}
        />
      </div>

      <div className="admin-cms__card mt-6" data-tour="store-list">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h2 className="text-lg font-semibold">Productos ({products.length})</h2>
        </div>

        {products.length === 0 ? (
          <p className="text-muted text-sm">No hay productos en este idioma. Usa el formulario de arriba.</p>
        ) : (
          <ul className="space-y-3">
            {products.map((product) => (
              <li
                key={product.id}
                className={`rounded-xl border p-4 ${
                  editingId === product.id
                    ? "border-[rgb(var(--primary)/0.45)] bg-[rgb(var(--primary)/0.06)]"
                    : "border-theme bg-[rgb(var(--bg)/0.35)]"
                }`}
              >
                <div className="flex gap-4 items-start">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt=""
                      className="w-16 h-16 rounded-lg object-contain border border-theme flex-shrink-0 bg-[rgb(var(--bg)/0.5)]"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-lg border border-theme bg-[rgb(var(--primary)/0.06)] flex-shrink-0" />
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{product.name}</span>
                      {product.category ? (
                        <span className="text-xs px-2 py-0.5 rounded-full border border-[rgb(var(--primary)/0.35)] text-[rgb(var(--primary))] bg-[rgb(var(--primary)/0.08)]">
                          {product.category.name}
                        </span>
                      ) : null}
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full border ${
                          product.is_published
                            ? "border-green-500/40 text-green-700 bg-green-500/10"
                            : "border-theme text-muted bg-surface"
                        }`}
                      >
                        {product.is_published ? "Disponible" : "Oculto"}
                      </span>
                    </div>
                    {product.description ? (
                      <p className="text-sm text-muted mt-1 line-clamp-2">{product.description}</p>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap gap-2 flex-shrink-0">
                    <button
                      type="button"
                      className="admin-cms__btn"
                      disabled={saving}
                      onClick={() => startEditProduct(product)}
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      className="admin-cms__btn admin-cms__btn--ghost"
                      disabled={saving}
                      onClick={() => void togglePublished(product.id)}
                    >
                      {product.is_published ? "Ocultar" : "Publicar"}
                    </button>
                    <button
                      type="button"
                      className="admin-cms__btn admin-cms__btn--danger"
                      disabled={saving}
                      onClick={() => {
                        if (window.confirm(`¿Eliminar "${product.name}"?`)) {
                          void deleteProduct(product.id);
                        }
                      }}
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function ProductForm({
  locale,
  country,
  draft,
  categories,
  saving,
  isEditing,
  onChange,
  onSave,
  suggestRefFromName,
}: {
  locale: Locale;
  country: string;
  draft: ReturnType<typeof useStoreAdmin>["draft"];
  categories: ReturnType<typeof useStoreAdmin>["categories"];
  saving: boolean;
  isEditing: boolean;
  onChange: (patch: Partial<typeof draft>) => void;
  onSave: () => void;
  suggestRefFromName: (name: string) => string;
}) {
  const fresh = draft.id === "draft" && !draft.name && !(draft.referral_url || "").trim() && draft.price_min == null && !draft.image_url;
  const [offer, setOffer] = useState<"tienda" | "enlace">((draft.referral_url || "").trim() ? "enlace" : "tienda");
  useEffect(() => {
    setOffer((draft.referral_url || "").trim() ? "enlace" : "tienda");
  }, [draft.id, fresh]);

  function chooseOffer(next: "tienda" | "enlace") {
    setOffer(next);
    if (next === "tienda") onChange({ referral_url: "" });
    else onChange({ price_min: null, price_max: null, compare_at_price_min: null });
  }

  return (
    <div className="store-composer">
      <div className="store-composer__main">
        <label className="store-field">
          <span>Tipo</span>
          <select value={offer} onChange={(e) => chooseOffer(e.target.value as "tienda" | "enlace")}>
            <option value="tienda">Producto de la tienda</option>
            <option value="enlace">Enlace de referido</option>
          </select>
        </label>

        <label className="store-field">
          <span>Nombre</span>
          <input
            required
            value={draft.name}
            placeholder="Nombre"
            onChange={(e) => {
              const name = e.target.value;
              const patch: Partial<typeof draft> = { name };
              if (!isEditing && (!draft.ref.trim() || draft.id === "draft")) {
                patch.ref = suggestRefFromName(name);
              }
              onChange(patch);
            }}
          />
        </label>

        {offer === "tienda" ? (
          <div className="store-field store-field--split">
            <label>
              <span>Precio</span>
              <input
                type="number"
                min={0}
                step="0.01"
                value={draft.price_min ?? ""}
                placeholder="0.00"
                onChange={(e) => {
                  const price = e.target.value === "" ? null : Number(e.target.value);
                  onChange({ price_min: price, price_max: price, compare_at_price_min: null });
                }}
              />
            </label>
            <label className="store-field__aside">
              <span>Moneda</span>
              <input
                value={country === "US" ? "USD" : draft.currency ?? "MXN"}
                maxLength={3}
                readOnly={country === "US"}
                aria-readonly={country === "US"}
                onChange={(e) => {
                  if (country === "US") return;
                  onChange({ currency: e.target.value.toUpperCase() });
                }}
              />
            </label>
          </div>
        ) : (
          <label className="store-field">
            <span>Enlace de referido</span>
            <input
              type="url"
              value={draft.referral_url}
              placeholder="https://"
              onChange={(e) => onChange({ referral_url: e.target.value })}
            />
          </label>
        )}

        <label className="store-field">
          <span>Descripción para el cliente</span>
          <textarea
            value={draft.description}
            rows={4}
            onChange={(e) => onChange({ description: e.target.value })}
          />
        </label>

        <CmsImageField
          layout="drop"
          locale={locale}
          uploadFolder="products"
          label="Imagen"
          value={draft.image_url}
          onChange={(image_url) => onChange({ image_url })}
        />
      </div>

      <aside className="store-composer__side">
        <section className="store-side">
          <div className="store-side__head">
            <h3>Estado</h3>
            <span className={`store-status${draft.is_published ? " is-on" : ""}`}>
              {draft.is_published ? "Disponible" : "Oculto"}
            </span>
          </div>
          <select
            value={draft.is_published ? "on" : "off"}
            onChange={(e) => onChange({ is_published: e.target.value === "on" })}
          >
            <option value="on">Disponible</option>
            <option value="off">Oculto</option>
          </select>
        </section>

        <section className="store-side">
          <h3>Categoría</h3>
          <select
            value={draft.category_id ?? ""}
            onChange={(e) => onChange({ category_id: e.target.value ? e.target.value : null })}
          >
            <option value="">Sin categoría</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </section>

        <section className="store-side">
          <h3>Catálogo</h3>
          <p className="store-side__meta">{country === "US" ? "Estados Unidos · el precio se publica en Square al guardar" : "México"}</p>
          <label className="store-side__order">
            <span>Orden</span>
            <input
              type="number"
              value={draft.sort_order}
              onChange={(e) => onChange({ sort_order: Number(e.target.value) || 0 })}
            />
          </label>
        </section>

        <button type="button" className="admin-cms__btn store-composer__save" disabled={saving} onClick={onSave}>
          {saving ? "Guardando…" : isEditing ? "Guardar cambios" : "Crear producto"}
        </button>
      </aside>
    </div>
  );
}
