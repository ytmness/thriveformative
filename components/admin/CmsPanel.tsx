"use client";

import { useState } from "react";
import { CMS_TEXT_GROUPS } from "@/lib/cms/textKeys";
import { CMS_LOCALES, type Locale } from "@/lib/cms/types";
import { useCmsAdmin } from "@/hooks/useCmsAdmin";
import CmsVisualPreview from "@/components/admin/cms/CmsVisualPreview";
import "@/app/styles/admin-cms.css";
import "@/app/styles/admin-cms-visual.css";

type SubTab = "services" | "plans" | "articles" | "texts";
type ViewMode = "visual" | "forms";

const LOCALE_LABELS: Record<Locale, string> = {
  es: "Español",
  en: "English",
  ko: "한국어",
  it: "Italiano",
};

type Props = {
  siteLocale: string;
};

export default function CmsPanel({ siteLocale }: Props) {
  const cms = useCmsAdmin(siteLocale as Locale);
  const [viewMode, setViewMode] = useState<ViewMode>("visual");
  const [subTab, setSubTab] = useState<SubTab>("services");

  const {
    locale,
    setLocale,
    loading,
    saving,
    message,
    services,
    setServices,
    plans,
    setPlans,
    articles,
    setArticles,
    textDraft,
    updateTextDraft,
    saveService,
    deleteService,
    savePlan,
    deletePlan,
    saveArticle,
    deleteArticle,
    saveAllTexts,
    addService,
    addPlan,
    addArticle,
  } = cms;

  if (loading) {
    return <div className="mt-10 animate-pulse h-48 bg-surface rounded-2xl border border-theme" />;
  }

  return (
    <section className="admin-cms mt-10" aria-label="CMS contenido">
      <div className="admin-cms__toolbar">
        <div className="flex flex-wrap items-center gap-3">
          <div className="admin-cms__view-toggle" role="tablist" aria-label="Modo de edición">
            <button
              type="button"
              role="tab"
              aria-selected={viewMode === "visual"}
              className={`admin-cms__view-btn${viewMode === "visual" ? " admin-cms__view-btn--active" : ""}`}
              onClick={() => setViewMode("visual")}
            >
              Vista previa
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={viewMode === "forms"}
              className={`admin-cms__view-btn${viewMode === "forms" ? " admin-cms__view-btn--active" : ""}`}
              onClick={() => setViewMode("forms")}
            >
              Lista / formularios
            </button>
          </div>
          <div className="admin-cms__locale-select">
            <label htmlFor="cms-locale">Idioma a editar</label>
            <select
              id="cms-locale"
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
        </div>
        <p className="text-sm text-muted max-w-md">
          {viewMode === "visual"
            ? "Haz clic en los bloques de la página para editarlos al instante."
            : "Vista clásica con formularios por sección."}
        </p>
      </div>

      {message && (
        <div className={`admin-cms__msg admin-cms__msg--${message.type}`}>{message.text}</div>
      )}

      {viewMode === "visual" ? (
        <CmsVisualPreview cms={cms} siteLocale={siteLocale} />
      ) : (
        <>
          <div className="admin-cms__subtabs">
            {(
              [
                ["services", "Servicios"],
                ["plans", "Planes"],
                ["articles", "Artículos"],
                ["texts", "Textos del sitio"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                className={`admin-cms__subtab${subTab === id ? " admin-cms__subtab--active" : ""}`}
                onClick={() => setSubTab(id)}
              >
                {label}
              </button>
            ))}
          </div>

          {subTab === "services" && (
            <div className="admin-cms__card">
              <button type="button" className="admin-cms__btn mb-4" onClick={() => addService()}>
                + Añadir servicio
              </button>
              {services.map((row, i) => (
                <div key={row.id} className="admin-cms__row">
                  <div className="admin-cms__field">
                    <label>Nombre</label>
                    <input
                      value={row.name}
                      onChange={(e) =>
                        setServices((prev) =>
                          prev.map((s, j) => (j === i ? { ...s, name: e.target.value } : s))
                        )
                      }
                    />
                  </div>
                  <div className="admin-cms__field">
                    <label>Descripción</label>
                    <textarea
                      value={row.description}
                      onChange={(e) =>
                        setServices((prev) =>
                          prev.map((s, j) =>
                            j === i ? { ...s, description: e.target.value } : s
                          )
                        )
                      }
                    />
                  </div>
                  <div className="flex flex-wrap gap-4 items-center">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={row.is_published}
                        onChange={(e) =>
                          setServices((prev) =>
                            prev.map((s, j) =>
                              j === i ? { ...s, is_published: e.target.checked } : s
                            )
                          )
                        }
                      />
                      Publicado
                    </label>
                    <div className="admin-cms__field admin-cms__field--narrow">
                      <label>Orden</label>
                      <input
                        type="number"
                        value={row.sort_order}
                        onChange={(e) =>
                          setServices((prev) =>
                            prev.map((s, j) =>
                              j === i
                                ? { ...s, sort_order: parseInt(e.target.value, 10) || 0 }
                                : s
                            )
                          )
                        }
                      />
                    </div>
                  </div>
                  <div className="admin-cms__actions">
                    <button
                      type="button"
                      className="admin-cms__btn"
                      disabled={saving}
                      onClick={() => saveService(row)}
                    >
                      Guardar
                    </button>
                    <button
                      type="button"
                      className="admin-cms__btn admin-cms__btn--danger"
                      onClick={() => deleteService(row.id)}
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
              {!services.length && (
                <p className="text-muted text-sm">No hay servicios en CMS para este idioma.</p>
              )}
            </div>
          )}

          {subTab === "plans" && (
            <div className="admin-cms__card">
              <button type="button" className="admin-cms__btn mb-4" onClick={() => addPlan()}>
                + Añadir plan
              </button>
              {plans.map((row, i) => (
                <div key={row.id} className="admin-cms__row">
                  <div className="admin-cms__field">
                    <label>Nombre del plan</label>
                    <input
                      value={row.name}
                      onChange={(e) =>
                        setPlans((prev) =>
                          prev.map((p, j) => (j === i ? { ...p, name: e.target.value } : p))
                        )
                      }
                    />
                  </div>
                  <div className="admin-cms__field">
                    <label>Beneficios (uno por línea)</label>
                    <textarea
                      value={row.items.join("\n")}
                      onChange={(e) =>
                        setPlans((prev) =>
                          prev.map((p, j) =>
                            j === i
                              ? {
                                  ...p,
                                  items: e.target.value.split("\n").map((x) => x.trim()),
                                }
                              : p
                          )
                        )
                      }
                    />
                  </div>
                  <div className="flex flex-wrap gap-4">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={row.is_featured}
                        onChange={(e) =>
                          setPlans((prev) =>
                            prev.map((p, j) =>
                              j === i ? { ...p, is_featured: e.target.checked } : p
                            )
                          )
                        }
                      />
                      Destacado (recomendado)
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={row.is_published}
                        onChange={(e) =>
                          setPlans((prev) =>
                            prev.map((p, j) =>
                              j === i ? { ...p, is_published: e.target.checked } : p
                            )
                          )
                        }
                      />
                      Publicado
                    </label>
                  </div>
                  <div className="admin-cms__actions">
                    <button
                      type="button"
                      className="admin-cms__btn"
                      disabled={saving}
                      onClick={() => savePlan(row)}
                    >
                      Guardar
                    </button>
                    <button
                      type="button"
                      className="admin-cms__btn admin-cms__btn--danger"
                      onClick={() => deletePlan(row.id)}
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {subTab === "articles" && (
            <div className="admin-cms__card">
              <button type="button" className="admin-cms__btn mb-4" onClick={() => addArticle()}>
                + Añadir artículo
              </button>
              {articles.map((row, i) => (
                <div key={row.id} className="admin-cms__row">
                  <div className="admin-cms__field">
                    <label>Categoría</label>
                    <input
                      value={row.category}
                      onChange={(e) =>
                        setArticles((prev) =>
                          prev.map((a, j) => (j === i ? { ...a, category: e.target.value } : a))
                        )
                      }
                    />
                  </div>
                  <div className="admin-cms__field">
                    <label>Título</label>
                    <input
                      value={row.title}
                      onChange={(e) =>
                        setArticles((prev) =>
                          prev.map((a, j) => (j === i ? { ...a, title: e.target.value } : a))
                        )
                      }
                    />
                  </div>
                  <div className="admin-cms__field">
                    <label>Cuerpo (opcional)</label>
                    <textarea
                      value={row.body ?? ""}
                      onChange={(e) =>
                        setArticles((prev) =>
                          prev.map((a, j) => (j === i ? { ...a, body: e.target.value } : a))
                        )
                      }
                    />
                  </div>
                  <div className="admin-cms__field">
                    <label>URL imagen (opcional)</label>
                    <input
                      value={row.image_url ?? ""}
                      onChange={(e) =>
                        setArticles((prev) =>
                          prev.map((a, j) =>
                            j === i ? { ...a, image_url: e.target.value || null } : a
                          )
                        )
                      }
                    />
                  </div>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={row.is_published}
                      onChange={(e) =>
                        setArticles((prev) =>
                          prev.map((a, j) =>
                            j === i ? { ...a, is_published: e.target.checked } : a
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
                      onClick={() => saveArticle(row)}
                    >
                      Guardar
                    </button>
                    <button
                      type="button"
                      className="admin-cms__btn admin-cms__btn--danger"
                      onClick={() => deleteArticle(row.id)}
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {subTab === "texts" && (
            <div className="admin-cms__card">
              {CMS_TEXT_GROUPS.map((group) => (
                <div key={group.group} className="admin-cms__text-group">
                  <h3>{group.group}</h3>
                  {group.keys.map((k) => (
                    <div key={k.key} className="admin-cms__field mb-3">
                      <label>
                        {k.label}{" "}
                        <span className="text-muted font-normal">({k.key})</span>
                      </label>
                      <textarea
                        rows={2}
                        value={textDraft[k.key] ?? ""}
                        onChange={(e) => updateTextDraft(k.key, e.target.value)}
                      />
                    </div>
                  ))}
                </div>
              ))}
              <button
                type="button"
                className="admin-cms__btn"
                disabled={saving}
                onClick={saveAllTexts}
              >
                Guardar todos los textos
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
