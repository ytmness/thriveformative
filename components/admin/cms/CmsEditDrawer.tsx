"use client";

import { useEffect } from "react";
import type { CmsAdminApi } from "@/hooks/useCmsAdmin";
import type { CmsArticle, CmsPlan, CmsService } from "@/lib/cms/types";

export type CmsEditTarget =
  | {
      kind: "texts";
      title: string;
      subtitle?: string;
      keys: { key: string; label: string }[];
    }
  | { kind: "service"; id: string }
  | { kind: "plan"; id: string }
  | { kind: "article"; id: string };

type Props = {
  target: CmsEditTarget | null;
  onClose: () => void;
  cms: CmsAdminApi;
};

export default function CmsEditDrawer({ target, onClose, cms }: Props) {
  const {
    saving,
    textDraft,
    updateTextDraft,
    saveTextKeys,
    saveService,
    savePlan,
    saveArticle,
    deleteService,
    deletePlan,
    deleteArticle,
    getServiceById,
    getPlanById,
    getArticleById,
    updateService,
    updatePlan,
    updateArticle,
  } = cms;

  useEffect(() => {
    if (!target) return;
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [target, onClose]);

  if (!target) return null;

  async function handleSaveTexts() {
    const keys = target?.kind === "texts" ? target.keys.map((k) => k.key) : [];
    const ok = await saveTextKeys(keys);
    if (ok) onClose();
  }

  async function handleSaveService(row: CmsService) {
    const ok = await saveService(row);
    if (ok) onClose();
  }

  async function handleSavePlan(row: CmsPlan) {
    const ok = await savePlan(row);
    if (ok) onClose();
  }

  async function handleSaveArticle(row: CmsArticle) {
    const ok = await saveArticle(row);
    if (ok) onClose();
  }

  let title = "";
  let body: React.ReactNode = null;
  let onSave: (() => void) | null = null;
  let onDelete: (() => void) | null = null;

  if (target.kind === "texts") {
    title = target.title;
    body = (
      <>
        {target.subtitle && <p className="cms-drawer__subtitle">{target.subtitle}</p>}
        {target.keys.map((k) => (
          <div key={k.key} className="cms-drawer__field">
            <label htmlFor={`drawer-${k.key}`}>{k.label}</label>
            <textarea
              id={`drawer-${k.key}`}
              rows={k.key.includes("benefit") || k.key.includes("subtitle") ? 2 : 3}
              value={textDraft[k.key] ?? ""}
              onChange={(e) => updateTextDraft(k.key, e.target.value)}
            />
          </div>
        ))}
      </>
    );
    onSave = () => void handleSaveTexts();
  }

  if (target.kind === "service") {
    const row = getServiceById(target.id);
    if (!row) return null;
    title = "Servicio";
    body = (
      <ServiceForm row={row} onChange={(patch) => updateService(target.id, patch)} />
    );
    onSave = () => {
      const current = getServiceById(target.id);
      if (current) void handleSaveService(current);
    };
    onDelete = () => void deleteService(target.id).then((ok) => ok && onClose());
  }

  if (target.kind === "plan") {
    const row = getPlanById(target.id);
    if (!row) return null;
    title = "Plan";
    body = <PlanForm row={row} onChange={(patch) => updatePlan(target.id, patch)} />;
    onSave = () => {
      const current = getPlanById(target.id);
      if (current) void handleSavePlan(current);
    };
    onDelete = () => void deletePlan(target.id).then((ok) => ok && onClose());
  }

  if (target.kind === "article") {
    const row = getArticleById(target.id);
    if (!row) return null;
    title = "Artículo / noticia";
    body = <ArticleForm row={row} onChange={(patch) => updateArticle(target.id, patch)} />;
    onSave = () => {
      const current = getArticleById(target.id);
      if (current) void handleSaveArticle(current);
    };
    onDelete = () => void deleteArticle(target.id).then((ok) => ok && onClose());
  }

  return (
    <>
      <div
        className="cms-drawer-backdrop"
        role="presentation"
        onClick={onClose}
        aria-hidden
      />
      <aside className="cms-drawer" role="dialog" aria-modal="true" aria-labelledby="cms-drawer-title">
        <header className="cms-drawer__head">
          <div>
            <h2 id="cms-drawer-title" className="cms-drawer__title">
              {title}
            </h2>
            {target.kind === "texts" && target.subtitle ? null : (
              <p className="cms-drawer__subtitle">Cambios solo para el idioma seleccionado.</p>
            )}
          </div>
          <button type="button" className="cms-drawer__close" onClick={onClose} aria-label="Cerrar">
            ×
          </button>
        </header>
        <div className="cms-drawer__body">{body}</div>
        <footer className="cms-drawer__foot">
          {onDelete && (
            <button
              type="button"
              className="admin-cms__btn admin-cms__btn--danger"
              disabled={saving}
              onClick={onDelete}
            >
              Eliminar
            </button>
          )}
          <button type="button" className="admin-cms__btn" disabled={saving} onClick={onClose}>
            Cancelar
          </button>
          {onSave && (
            <button type="button" className="admin-cms__btn" disabled={saving} onClick={onSave}>
              {saving ? "Guardando…" : "Guardar"}
            </button>
          )}
        </footer>
      </aside>
    </>
  );
}

function ServiceForm({
  row,
  onChange,
}: {
  row: CmsService;
  onChange: (patch: Partial<CmsService>) => void;
}) {
  return (
    <>
      <div className="cms-drawer__field">
        <label>Nombre</label>
        <input value={row.name} onChange={(e) => onChange({ name: e.target.value })} />
      </div>
      <div className="cms-drawer__field">
        <label>Descripción</label>
        <textarea
          value={row.description}
          onChange={(e) => onChange({ description: e.target.value })}
        />
      </div>
      <label className="cms-drawer__check">
        <input
          type="checkbox"
          checked={row.is_published}
          onChange={(e) => onChange({ is_published: e.target.checked })}
        />
        Publicado en el sitio
      </label>
      <div className="cms-drawer__field">
        <label>Orden</label>
        <input
          type="number"
          value={row.sort_order}
          onChange={(e) => onChange({ sort_order: parseInt(e.target.value, 10) || 0 })}
        />
      </div>
    </>
  );
}

function PlanForm({
  row,
  onChange,
}: {
  row: CmsPlan;
  onChange: (patch: Partial<CmsPlan>) => void;
}) {
  return (
    <>
      <div className="cms-drawer__field">
        <label>Nombre del plan</label>
        <input value={row.name} onChange={(e) => onChange({ name: e.target.value })} />
      </div>
      <div className="cms-drawer__field">
        <label>Beneficios (uno por línea)</label>
        <textarea
          value={row.items.join("\n")}
          onChange={(e) =>
            onChange({
              items: e.target.value.split("\n").map((x) => x.trim()),
            })
          }
        />
      </div>
      <label className="cms-drawer__check">
        <input
          type="checkbox"
          checked={row.is_featured}
          onChange={(e) => onChange({ is_featured: e.target.checked })}
        />
        Plan destacado (badge recomendado)
      </label>
      <label className="cms-drawer__check">
        <input
          type="checkbox"
          checked={row.is_published}
          onChange={(e) => onChange({ is_published: e.target.checked })}
        />
        Publicado
      </label>
    </>
  );
}

function ArticleForm({
  row,
  onChange,
}: {
  row: CmsArticle;
  onChange: (patch: Partial<CmsArticle>) => void;
}) {
  return (
    <>
      <div className="cms-drawer__field">
        <label>Categoría</label>
        <input value={row.category} onChange={(e) => onChange({ category: e.target.value })} />
      </div>
      <div className="cms-drawer__field">
        <label>Título</label>
        <input value={row.title} onChange={(e) => onChange({ title: e.target.value })} />
      </div>
      <div className="cms-drawer__field">
        <label>Cuerpo (opcional)</label>
        <textarea
          value={row.body ?? ""}
          onChange={(e) => onChange({ body: e.target.value || null })}
        />
      </div>
      <div className="cms-drawer__field">
        <label>URL de imagen (opcional)</label>
        <input
          value={row.image_url ?? ""}
          onChange={(e) => onChange({ image_url: e.target.value || null })}
        />
      </div>
      <label className="cms-drawer__check">
        <input
          type="checkbox"
          checked={row.is_published}
          onChange={(e) => onChange({ is_published: e.target.checked })}
        />
        Publicado
      </label>
    </>
  );
}
