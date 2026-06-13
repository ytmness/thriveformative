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
  const store = useStoreAdmin(siteLocale as Locale);
  const { locale, setLocale, loading, saving, message, products, setProducts, saveProduct, deleteProduct, addProduct, suggestRefFromName } =
    store;

  if (loading) {
    return <div className="mt-10 animate-pulse h-48 bg-surface rounded-2xl border border-theme" />;
  }

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
          Catálogo con enlaces de referido externos. Cada producto tiene un ref (slug) para la URL
          interna <code className="text-xs">/tienda/ref</code>.
        </p>
      </div>

      {message && (
        <div className={`admin-cms__msg admin-cms__msg--${message.type}`}>{message.text}</div>
      )}

      <div className="admin-cms__card">
        <button type="button" className="admin-cms__btn mb-4" onClick={() => addProduct()}>
          + Añadir producto
        </button>

        {products.length === 0 ? (
          <p className="text-muted text-sm">No hay productos en este idioma.</p>
        ) : null}

        {products.map((row, i) => (
          <div key={row.id} className="admin-cms__row">
            <div className="admin-cms__field">
              <label>Nombre</label>
              <input
                value={row.name}
                onChange={(e) => {
                  const name = e.target.value;
                  setProducts((prev) =>
                    prev.map((p, j) => {
                      if (j !== i) return p;
                      const patch: Partial<typeof p> = { name };
                      if (!p.ref.trim() || p.id.startsWith("new-")) {
                        patch.ref = suggestRefFromName(name);
                      }
                      return { ...p, ...patch };
                    })
                  );
                }}
              />
            </div>

            <div className="admin-cms__field">
              <label>Descripción</label>
              <textarea
                value={row.description}
                rows={3}
                onChange={(e) =>
                  setProducts((prev) =>
                    prev.map((p, j) => (j === i ? { ...p, description: e.target.value } : p))
                  )
                }
              />
            </div>

            <div className="admin-cms__field">
              <label>
                Ref (slug){" "}
                <span className="text-muted font-normal">
                  → /{locale}/tienda/{row.ref || "…"}
                </span>
              </label>
              <input
                value={row.ref}
                placeholder="vitamina-d"
                onChange={(e) =>
                  setProducts((prev) =>
                    prev.map((p, j) =>
                      j === i ? { ...p, ref: slugifyInput(e.target.value) } : p
                    )
                  )
                }
              />
            </div>

            <div className="admin-cms__field">
              <label>Enlace de referido (tienda externa)</label>
              <input
                type="url"
                value={row.referral_url}
                placeholder="https://…"
                onChange={(e) =>
                  setProducts((prev) =>
                    prev.map((p, j) => (j === i ? { ...p, referral_url: e.target.value } : p))
                  )
                }
              />
            </div>

            <div className="admin-cms__field">
              <label>Orden</label>
              <input
                type="number"
                value={row.sort_order}
                onChange={(e) =>
                  setProducts((prev) =>
                    prev.map((p, j) =>
                      j === i ? { ...p, sort_order: Number(e.target.value) || 0 } : p
                    )
                  )
                }
              />
            </div>

            <CmsImageField
              locale={locale}
              uploadFolder="products"
              value={row.image_url}
              onChange={(image_url) =>
                setProducts((prev) =>
                  prev.map((p, j) => (j === i ? { ...p, image_url } : p))
                )
              }
            />

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={row.is_published}
                onChange={(e) =>
                  setProducts((prev) =>
                    prev.map((p, j) =>
                      j === i ? { ...p, is_published: e.target.checked } : p
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
                onClick={() => saveProduct(row)}
              >
                Guardar
              </button>
              <button
                type="button"
                className="admin-cms__btn admin-cms__btn--danger"
                onClick={() => deleteProduct(row.id)}
              >
                Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function slugifyInput(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}
