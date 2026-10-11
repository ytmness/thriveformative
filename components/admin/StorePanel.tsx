"use client";

import { CMS_LOCALES, type Locale } from "@/lib/cms/types";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/components/admin/clinic/client";
import { useClinicScope } from "@/components/admin/clinic/ClinicScope";
import { useStoreAdmin } from "@/hooks/useStoreAdmin";
import ProductPhotosField from "@/components/admin/store/ProductPhotosField";
import { productImageList } from "@/lib/store/images";
import "@/app/styles/admin-cms.css";

const LOCALE_LABELS: Record<Locale, string> = {
  es: "Español",
  en: "English",
  ko: "한국어",
  it: "Italiano",
};

type Channel = "web" | "link" | "pos";
type PosDraft = { cost: string; sku: string; barcode: string; categoryId: string; stock: string };
type Named = { id: string; name: string };

type Props = {
  siteLocale: string;
};

function storeCopy(english: boolean) {
  return {
    title: english ? "Web store" : "Tienda web",
    desc: english
      ? "Create a web store product or a point-of-sale product here. A price with no link checks out on the site. A referral link only redirects. In the United States the web price is published to Square when you save."
      : "Crea aquí un producto de tienda web o de punto de venta. Con precio y sin enlace, se cobra en el sitio. Con enlace de referido, solo redirige. En Estados Unidos el precio web se publica en Square al guardar.",
    localeLabel: english ? "Language to edit" : "Idioma a editar",
    hint: english
      ? "Web copy follows the language above. Point of sale is saved in the clinic catalog for this location."
      : "El texto de la tienda sigue el idioma de arriba. El punto de venta se guarda en el catálogo de la clínica, en esta sede.",
    edit: english ? "Edit product" : "Editar producto",
    create: english ? "Create product" : "Crear producto",
    cancel: english ? "Cancel editing" : "Cancelar edición",
    products: english ? "Products" : "Productos",
    empty: english ? "No products match this search." : "Ningún producto coincide con la búsqueda.",
    emptyAll: english ? "No products in this language. Use the form above." : "No hay productos en este idioma. Usa el formulario de arriba.",
    search: english ? "Search by name" : "Buscar por nombre",
    allCategories: english ? "All categories" : "Todas las categorías",
    deleteSelected: (n: number) => (english ? `Delete ${n}` : `Eliminar ${n}`),
    confirmMany: (n: number) => (english ? `Delete ${n} products?` : `¿Eliminar ${n} productos?`),
    editBtn: english ? "Edit" : "Editar",
    hide: english ? "Hide" : "Ocultar",
    publish: english ? "Publish" : "Publicar",
    remove: english ? "Delete" : "Eliminar",
    confirmOne: (name: string) => (english ? `Delete "${name}"?` : `¿Eliminar "${name}"?`),
    photos: (n: number) => (english ? `${n} photos` : `${n} fotos`),
    available: english ? "Available" : "Disponible",
    hidden: english ? "Hidden" : "Oculto",
    type: english ? "Type" : "Tipo",
    web: english ? "Web store product" : "Producto de tienda web",
    link: english ? "Referral link" : "Enlace de referido",
    pos: english ? "Point of sale product" : "Producto de punto de venta",
    name: english ? "Name" : "Nombre",
    price: english ? "Price" : "Precio",
    currency: english ? "Currency" : "Moneda",
    cost: english ? "Cost" : "Costo",
    linkUrl: english ? "Referral link" : "Enlace de referido",
    description: english ? "Description for the customer" : "Descripción para el cliente",
    status: english ? "Status" : "Estado",
    category: english ? "Category" : "Categoría",
    noCategory: english ? "No category" : "Sin categoría",
    newCategory: english ? "New category" : "Nueva categoría",
    add: english ? "Add" : "Agregar",
    deleteCategory: english ? "Delete category" : "Eliminar categoría",
    confirmCategory: (name: string) =>
      english
        ? `Delete the category "${name}"? Products will be left without a category.`
        : `¿Eliminar la categoría "${name}"? Los productos quedarán sin categoría.`,
    catalog: english ? "Catalog" : "Catálogo",
    usNote: english ? "United States · the price is published to Square when you save" : "Estados Unidos · el precio se publica en Square al guardar",
    mxNote: english ? "Mexico" : "México",
    order: english ? "Order" : "Orden",
    saving: english ? "Saving…" : "Guardando…",
    saveChanges: english ? "Save changes" : "Guardar cambios",
    createProduct: english ? "Create product" : "Crear producto",
    stock: english ? "Stock" : "Stock",
    stockAt: (place: string) => (english ? `Units at ${place}` : `Unidades en ${place}`),
    posNote: english ? "This product is saved in the point of sale, not on the public store." : "Este producto se guarda en el punto de venta, no en la tienda pública.",
    posSaved: english ? "Point of sale product created." : "Producto de punto de venta creado.",
    posNeedName: english ? "The name is required." : "El nombre es obligatorio.",
    posNeedLocation: english ? "Pick a location before saving stock." : "Elige una sede antes de guardar el stock.",
    selectAll: english ? "Select visible" : "Seleccionar visibles",
    clearSelection: english ? "Clear" : "Quitar selección",
  };
}

export default function StorePanel({ siteLocale }: Props) {
  const scope = useClinicScope();
  const english = scope.country === "US";
  const copy = storeCopy(english);
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
  } = useStoreAdmin(siteLocale as Locale, scope.country);

  const [channel, setChannel] = useState<Channel>("web");
  const [pos, setPos] = useState<PosDraft>({ cost: "", sku: "", barcode: "", categoryId: "", stock: "" });
  const [posCategories, setPosCategories] = useState<Named[]>([]);
  const [posMessage, setPosMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [posSaving, setPosSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    setLocale(scope.country === "US" ? "en" : "es");
  }, [scope.country, setLocale]);

  useEffect(() => {
    api<{ rows: Named[] }>("/api/admin/settings/product-categories")
      .then((body) => setPosCategories(body.rows || []))
      .catch(() => setPosCategories([]));
  }, []);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return products.filter((product) => {
      const matchesText = !needle || `${product.name} ${product.ref}`.toLowerCase().includes(needle);
      const matchesCategory = !categoryIds.length || (product.category_id != null && categoryIds.includes(product.category_id));
      return matchesText && matchesCategory;
    });
  }, [products, query, categoryIds]);

  function toggleCategory(id: string) {
    setCategoryIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  function toggleSelected(id: string) {
    setSelected((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  async function removeSelected() {
    if (!selected.length) return;
    if (!window.confirm(copy.confirmMany(selected.length))) return;
    for (const id of selected) {
      await deleteProduct(id);
    }
    setSelected([]);
  }

  async function savePos() {
    setPosMessage(null);
    const name = draft.name.trim();
    if (!name) {
      setPosMessage({ type: "err", text: copy.posNeedName });
      return;
    }
    const quantity = pos.stock.trim() === "" ? 0 : Number(pos.stock);
    if (pos.stock.trim() !== "" && (!Number.isFinite(quantity) || quantity < 0)) return;
    if (quantity > 0 && !scope.locationId) {
      setPosMessage({ type: "err", text: copy.posNeedLocation });
      return;
    }
    setPosSaving(true);
    try {
      const created = await api<{ id: string }>("/api/admin/products", {
        method: "POST",
        body: JSON.stringify({
          name,
          sku: pos.sku.trim() || null,
          barcode: pos.barcode.trim() || null,
          cost: Number(pos.cost || 0),
          price: draft.price_min ?? 0,
          description: draft.description || "",
          categoryId: pos.categoryId || null,
          imageUrl: productImageList(draft)[0] || null,
        }),
      });
      if (quantity > 0) {
        await api("/api/admin/products", {
          method: "POST",
          body: JSON.stringify({
            kind: "stock",
            productId: created.id,
            locationId: scope.locationId,
            quantity,
            movementType: "purchase",
            reason: english ? "Initial stock" : "Stock inicial",
          }),
        });
      }
      setPos({ cost: "", sku: "", barcode: "", categoryId: "", stock: "" });
      startNewProduct();
      setPosMessage({ type: "ok", text: copy.posSaved });
    } catch (error) {
      setPosMessage({ type: "err", text: error instanceof Error ? error.message : "Error" });
    } finally {
      setPosSaving(false);
    }
  }

  if (loading) {
    return <div className="mt-10 animate-pulse h-48 bg-surface rounded-2xl border border-theme" />;
  }

  const isEditing = editingId !== null;
  const busy = saving || posSaving;

  return (
    <section className="admin-cms" aria-label={copy.title}>
      <header className="admin-header">
        <p className="admin-header__eyebrow">{copy.catalog} · {scope.label}</p>
        <h1 className="admin-header__title">{copy.title}</h1>
        <p className="admin-header__desc">{copy.desc}</p>
      </header>
      <div className="admin-cms__toolbar">
        <div className="admin-cms__locale-select">
          <label htmlFor="store-locale">{copy.localeLabel}</label>
          <select id="store-locale" value={locale} onChange={(e) => setLocale(e.target.value as Locale)}>
            {CMS_LOCALES.map((l) => (
              <option key={l} value={l}>{LOCALE_LABELS[l]}</option>
            ))}
          </select>
        </div>
        <p className="text-sm text-muted max-w-xl">{copy.hint}</p>
      </div>

      {message ? <div className={`admin-cms__msg admin-cms__msg--${message.type}`}>{message.text}</div> : null}
      {posMessage ? <div className={`admin-cms__msg admin-cms__msg--${posMessage.type}`}>{posMessage.text}</div> : null}

      <div className="store-composer-wrap" data-tour="store-form">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h2 className="admin-header__title" style={{ fontSize: "1.65rem" }}>
            {channel === "pos" ? copy.create : isEditing ? copy.edit : copy.create}
          </h2>
          {isEditing && channel !== "pos" ? (
            <button type="button" className="admin-cms__btn admin-cms__btn--ghost" onClick={() => { startNewProduct(); setChannel("web"); }}>
              {copy.cancel}
            </button>
          ) : null}
        </div>

        <ProductForm
          copy={copy}
          locale={locale}
          country={scope.country}
          locationLabel={scope.label}
          channel={channel}
          onChannel={(next) => {
            if (next === "pos" && isEditing) startNewProduct();
            setChannel(next);
            if (next === "web") updateDraft({ referral_url: "" });
            if (next === "link") updateDraft({ price_min: null, price_max: null, compare_at_price_min: null });
          }}
          draft={draft}
          categories={categories}
          pos={pos}
          onPos={(patch) => setPos((current) => ({ ...current, ...patch }))}
          posCategories={posCategories}
          saving={busy}
          isEditing={isEditing && channel !== "pos"}
          onChange={updateDraft}
          onSave={() => { if (channel === "pos") void savePos(); else void saveDraft(); }}
          suggestRefFromName={suggestRefFromName}
          categoryName={categoryName}
          onCategoryName={setCategoryName}
          onAddCategory={() => addCategory()}
          onDeleteCategory={(id) => deleteCategory(id)}
        />
      </div>

      <div className="admin-cms__card mt-6" data-tour="store-list">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h2 className="text-lg font-semibold">{copy.products} ({visible.length})</h2>
          {selected.length ? (
            <div className="flex gap-2">
              <button type="button" className="admin-cms__btn admin-cms__btn--ghost" onClick={() => setSelected([])}>{copy.clearSelection}</button>
              <button type="button" className="admin-cms__btn admin-cms__btn--danger" disabled={busy} onClick={() => void removeSelected()}>
                {copy.deleteSelected(selected.length)}
              </button>
            </div>
          ) : null}
        </div>

        <div className="store-filters">
          <input
            className="store-filters__search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={copy.search}
            aria-label={copy.search}
          />
          <div className="store-filters__cats" role="group" aria-label={copy.category}>
            <button type="button" className={!categoryIds.length ? "is-on" : ""} onClick={() => setCategoryIds([])}>{copy.allCategories}</button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                className={categoryIds.includes(cat.id) ? "is-on" : ""}
                aria-pressed={categoryIds.includes(cat.id)}
                onClick={() => toggleCategory(cat.id)}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {visible.length ? (
          <label className="store-filters__all">
            <input
              type="checkbox"
              checked={visible.every((product) => selected.includes(product.id))}
              onChange={(event) => {
                if (event.target.checked) setSelected(visible.map((product) => product.id));
                else setSelected((current) => current.filter((id) => !visible.some((product) => product.id === id)));
              }}
            />
            {copy.selectAll}
          </label>
        ) : null}

        {products.length === 0 ? (
          <p className="text-muted text-sm">{copy.emptyAll}</p>
        ) : visible.length === 0 ? (
          <p className="text-muted text-sm">{copy.empty}</p>
        ) : (
          <ul className="space-y-3">
            {visible.map((product) => {
              const photos = productImageList(product);
              return (
                <li
                  key={product.id}
                  className={`rounded-xl border p-4 ${
                    editingId === product.id
                      ? "border-[rgb(var(--primary)/0.45)] bg-[rgb(var(--primary)/0.06)]"
                      : "border-theme bg-[rgb(var(--bg)/0.35)]"
                  }`}
                >
                  <div className="flex gap-4 items-start">
                    <input
                      type="checkbox"
                      className="mt-1"
                      checked={selected.includes(product.id)}
                      aria-label={product.name}
                      onChange={() => toggleSelected(product.id)}
                    />
                    {photos[0] ? (
                      <img src={photos[0]} alt="" className="w-16 h-16 rounded-lg object-contain border border-theme flex-shrink-0 bg-[rgb(var(--bg)/0.5)]" />
                    ) : (
                      <div className="w-16 h-16 rounded-lg border border-theme bg-[rgb(var(--primary)/0.06)] flex-shrink-0" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">{product.name}</span>
                        {photos.length > 1 ? <span className="text-xs px-2 py-0.5 rounded-full border border-theme text-muted">{copy.photos(photos.length)}</span> : null}
                        {product.category ? (
                          <span className="text-xs px-2 py-0.5 rounded-full border border-[rgb(var(--primary)/0.35)] text-[rgb(var(--primary))] bg-[rgb(var(--primary)/0.08)]">
                            {product.category.name}
                          </span>
                        ) : null}
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${product.is_published ? "border-green-500/40 text-green-700 bg-green-500/10" : "border-theme text-muted bg-surface"}`}>
                          {product.is_published ? copy.available : copy.hidden}
                        </span>
                      </div>
                      {product.description ? <p className="text-sm text-muted mt-1 line-clamp-2">{product.description}</p> : null}
                    </div>
                    <div className="flex flex-wrap gap-2 flex-shrink-0">
                      <button type="button" className="admin-cms__btn" disabled={busy} onClick={() => { setChannel(product.referral_url?.trim() ? "link" : "web"); startEditProduct(product); }}>
                        {copy.editBtn}
                      </button>
                      <button type="button" className="admin-cms__btn admin-cms__btn--ghost" disabled={busy} onClick={() => void togglePublished(product.id)}>
                        {product.is_published ? copy.hide : copy.publish}
                      </button>
                      <button
                        type="button"
                        className="admin-cms__btn admin-cms__btn--danger"
                        disabled={busy}
                        onClick={() => { if (window.confirm(copy.confirmOne(product.name))) void deleteProduct(product.id); }}
                      >
                        {copy.remove}
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}

function ProductForm({
  copy,
  locale,
  country,
  locationLabel,
  channel,
  onChannel,
  draft,
  categories,
  pos,
  onPos,
  posCategories,
  saving,
  isEditing,
  onChange,
  onSave,
  suggestRefFromName,
  categoryName,
  onCategoryName,
  onAddCategory,
  onDeleteCategory,
}: {
  copy: ReturnType<typeof storeCopy>;
  locale: Locale;
  country: string;
  locationLabel: string;
  channel: Channel;
  onChannel: (next: Channel) => void;
  draft: ReturnType<typeof useStoreAdmin>["draft"];
  categories: ReturnType<typeof useStoreAdmin>["categories"];
  pos: PosDraft;
  onPos: (patch: Partial<PosDraft>) => void;
  posCategories: Named[];
  saving: boolean;
  isEditing: boolean;
  onChange: (patch: Partial<typeof draft>) => void;
  onSave: () => void;
  suggestRefFromName: (name: string) => string;
  categoryName: string;
  onCategoryName: (name: string) => void;
  onAddCategory: () => Promise<boolean>;
  onDeleteCategory: (id: string) => Promise<boolean>;
}) {
  const posMode = channel === "pos";

  return (
    <div className="store-composer">
      <div className="store-composer__main">
        <label className="store-field">
          <span>{copy.type}</span>
          <select value={channel} onChange={(e) => onChannel(e.target.value as Channel)}>
            <option value="web">{copy.web}</option>
            <option value="link">{copy.link}</option>
            <option value="pos">{copy.pos}</option>
          </select>
        </label>
        {posMode ? <p className="store-side__meta">{copy.posNote}</p> : null}

        <label className="store-field">
          <span>{copy.name}</span>
          <input
            required
            value={draft.name}
            placeholder={copy.name}
            onChange={(e) => {
              const name = e.target.value;
              const patch: Partial<typeof draft> = { name };
              if (!posMode && !isEditing && (!draft.ref.trim() || draft.id === "draft")) {
                patch.ref = suggestRefFromName(name);
              }
              onChange(patch);
            }}
          />
        </label>

        {channel === "link" ? (
          <label className="store-field">
            <span>{copy.linkUrl}</span>
            <input type="url" value={draft.referral_url} placeholder="https://" onChange={(e) => onChange({ referral_url: e.target.value })} />
          </label>
        ) : (
          <div className="store-field store-field--split">
            <label>
              <span>{copy.price}</span>
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
              <span>{copy.currency}</span>
              <input
                value={country === "US" ? "USD" : draft.currency ?? "MXN"}
                maxLength={3}
                readOnly={country === "US" || posMode}
                aria-readonly={country === "US" || posMode}
                onChange={(e) => {
                  if (country === "US" || posMode) return;
                  onChange({ currency: e.target.value.toUpperCase() });
                }}
              />
            </label>
          </div>
        )}

        {posMode ? (
          <div className="store-field store-field--split">
            <label>
              <span>{copy.cost}</span>
              <input type="number" min={0} step="0.01" value={pos.cost} placeholder="0.00" onChange={(e) => onPos({ cost: e.target.value })} />
            </label>
            <label>
              <span>SKU</span>
              <input value={pos.sku} onChange={(e) => onPos({ sku: e.target.value })} />
            </label>
          </div>
        ) : null}

        <label className="store-field">
          <span>{copy.description}</span>
          <textarea value={draft.description} rows={4} onChange={(e) => onChange({ description: e.target.value })} />
        </label>

        <ProductPhotosField
          locale={locale}
          urls={productImageList(draft)}
          onChange={(image_urls) => onChange({ image_urls, image_url: image_urls[0] ?? null })}
        />
      </div>

      <aside className="store-composer__side">
        {posMode ? (
          <>
            <section className="store-side">
              <h3>{copy.category}</h3>
              <select value={pos.categoryId} onChange={(e) => onPos({ categoryId: e.target.value })}>
                <option value="">{copy.noCategory}</option>
                {posCategories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
              </select>
            </section>
            <section className="store-side">
              <h3>{copy.stock}</h3>
              <p className="store-side__meta">{copy.stockAt(locationLabel)}</p>
              <label className="store-side__order">
                <span>{copy.stock}</span>
                <input type="number" min={0} step="1" value={pos.stock} placeholder="0" onChange={(e) => onPos({ stock: e.target.value })} />
              </label>
            </section>
          </>
        ) : (
          <>
            <section className="store-side">
              <div className="store-side__head">
                <h3>{copy.status}</h3>
                <span className={`store-status${draft.is_published ? " is-on" : ""}`}>{draft.is_published ? copy.available : copy.hidden}</span>
              </div>
              <select value={draft.is_published ? "on" : "off"} onChange={(e) => onChange({ is_published: e.target.value === "on" })}>
                <option value="on">{copy.available}</option>
                <option value="off">{copy.hidden}</option>
              </select>
            </section>
            <section className="store-side" data-tour="store-cats">
              <h3>{copy.category}</h3>
              <select value={draft.category_id ?? ""} onChange={(e) => onChange({ category_id: e.target.value ? e.target.value : null })}>
                <option value="">{copy.noCategory}</option>
                {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
              </select>
              <div className="store-side__actions">
                <div className="store-side__new">
                  <input
                    value={categoryName}
                    placeholder={copy.newCategory}
                    aria-label={copy.newCategory}
                    onChange={(e) => onCategoryName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        void onAddCategory();
                      }
                    }}
                  />
                  <button type="button" disabled={saving || !categoryName.trim()} onClick={() => void onAddCategory()}>{copy.add}</button>
                </div>
                {draft.category_id ? (
                  <button
                    type="button"
                    className="store-side__danger"
                    disabled={saving}
                    onClick={() => {
                      const current = categories.find((cat) => cat.id === draft.category_id);
                      if (window.confirm(copy.confirmCategory(current?.name || ""))) void onDeleteCategory(draft.category_id as string);
                    }}
                  >
                    {copy.deleteCategory}
                  </button>
                ) : null}
              </div>
            </section>
            <section className="store-side">
              <h3>{copy.catalog}</h3>
              <p className="store-side__meta">{country === "US" ? copy.usNote : copy.mxNote}</p>
              <label className="store-side__order">
                <span>{copy.order}</span>
                <input type="number" value={draft.sort_order} onChange={(e) => onChange({ sort_order: Number(e.target.value) || 0 })} />
              </label>
            </section>
          </>
        )}

        <button type="button" className="admin-cms__btn store-composer__save" disabled={saving} onClick={onSave}>
          {saving ? copy.saving : isEditing ? copy.saveChanges : copy.createProduct}
        </button>
      </aside>
    </div>
  );
}
