"use client";

import { CMS_LOCALES, type Locale } from "@/lib/cms/types";
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
    addCategory,
    togglePublished,
    startNewProduct,
    startEditProduct,
    suggestRefFromName,
  } = useStoreAdmin(siteLocale as Locale);

  if (loading) {
    return <div className="mt-10 animate-pulse h-48 bg-surface rounded-2xl border border-theme" />;
  }

  const isEditing = editingId !== null;

  return (
    <section className="admin-cms mt-10" aria-label="Tienda">
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
          Gestiona categorías y productos con enlace de referido. Al guardar un producto nuevo, el
          formulario se limpia.
        </p>
      </div>

      {message && (
        <div className={`admin-cms__msg admin-cms__msg--${message.type}`}>{message.text}</div>
      )}

      <div className="admin-cms__card">
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
                <span>{cat.name}</span>
                <span className="text-muted text-xs">/{cat.slug}</span>
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

      <div className="admin-cms__card mt-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h2 className="text-lg font-semibold">
            {isEditing ? "Editar producto" : "Nuevo producto"}
          </h2>
          {isEditing ? (
            <button type="button" className="admin-cms__btn admin-cms__btn--ghost" onClick={startNewProduct}>
              Cancelar edición
            </button>
          ) : null}
        </div>

        <ProductForm
          locale={locale}
          draft={draft}
          categories={categories}
          saving={saving}
          isEditing={isEditing}
          onChange={updateDraft}
          onSave={() => void saveDraft()}
          suggestRefFromName={suggestRefFromName}
        />
      </div>

      <div className="admin-cms__card mt-6">
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
                        {product.is_published ? "Publicado" : "Borrador"}
                      </span>
                    </div>
                    <p className="text-sm text-muted mt-1 truncate">
                      /{locale}/tienda/{product.ref}
                    </p>
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
  draft,
  categories,
  saving,
  isEditing,
  onChange,
  onSave,
  suggestRefFromName,
}: {
  locale: Locale;
  draft: ReturnType<typeof useStoreAdmin>["draft"];
  categories: ReturnType<typeof useStoreAdmin>["categories"];
  saving: boolean;
  isEditing: boolean;
  onChange: (patch: Partial<typeof draft>) => void;
  onSave: () => void;
  suggestRefFromName: (name: string) => string;
}) {
  return (
    <div className="admin-cms__row">
      <div className="admin-cms__field">
        <label>Nombre</label>
        <input
          value={draft.name}
          onChange={(e) => {
            const name = e.target.value;
            const patch: Partial<typeof draft> = { name };
            if (!isEditing && (!draft.ref.trim() || draft.id === "draft")) {
              patch.ref = suggestRefFromName(name);
            }
            onChange(patch);
          }}
        />
      </div>

      <div className="admin-cms__field">
        <label>Categoría</label>
        <select
          value={draft.category_id ?? ""}
          onChange={(e) =>
            onChange({ category_id: e.target.value ? e.target.value : null })
          }
        >
          <option value="">Sin categoría</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      <div className="admin-cms__field">
        <label>Descripción</label>
        <textarea
          value={draft.description}
          rows={3}
          onChange={(e) => onChange({ description: e.target.value })}
        />
      </div>

      <div className="admin-cms__field">
        <label>
          Ref (slug){" "}
          <span className="text-muted font-normal">
            → /{locale}/tienda/{draft.ref || "…"}
          </span>
        </label>
        <input
          value={draft.ref}
          placeholder="vitamina-d"
          onChange={(e) => onChange({ ref: slugifyInput(e.target.value) })}
        />
      </div>

      <div className="admin-cms__field">
        <label>Enlace de referido (tienda externa)</label>
        <input
          type="url"
          value={draft.referral_url}
          placeholder="https://…"
          onChange={(e) => onChange({ referral_url: e.target.value })}
        />
      </div>

      <div className="admin-cms__field">
        <label>Orden</label>
        <input
          type="number"
          value={draft.sort_order}
          onChange={(e) => onChange({ sort_order: Number(e.target.value) || 0 })}
        />
      </div>

      <CmsImageField
        locale={locale}
        uploadFolder="products"
        value={draft.image_url}
        onChange={(image_url) => onChange({ image_url })}
      />

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={draft.is_published}
          onChange={(e) => onChange({ is_published: e.target.checked })}
        />
        Publicado
      </label>

      <div className="admin-cms__actions">
        <button type="button" className="admin-cms__btn" disabled={saving} onClick={onSave}>
          {saving ? "Guardando…" : isEditing ? "Guardar cambios" : "Añadir producto"}
        </button>
      </div>
    </div>
  );
}

function slugifyInput(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}
