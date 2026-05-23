"use client";

import type { KeyboardEvent, MouseEvent, ReactNode } from "react";

type Props = {
  label: string;
  children: ReactNode;
  onEdit: () => void;
  className?: string;
  unpublished?: boolean;
  onToggleHide?: () => void;
  onDelete?: () => void;
};

export default function CmsEditableZone({
  label,
  children,
  onEdit,
  className = "",
  unpublished = false,
  onToggleHide,
  onDelete,
}: Props) {
  function handleKey(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onEdit();
    }
  }

  function stop(e: MouseEvent) {
    e.stopPropagation();
  }

  const hasToolbar = onToggleHide || onDelete;

  return (
    <div
      className={`cms-editable cms-editable--block${unpublished ? " cms-editable--unpublished" : ""}${hasToolbar ? " cms-editable--has-toolbar" : ""} ${className}`.trim()}
    >
      <span className="cms-editable__badge" aria-hidden>
        {unpublished ? "Oculto en el sitio" : "Editar"}
      </span>

      {hasToolbar ? (
        <div className="cms-editable__toolbar" role="toolbar" aria-label={`Acciones: ${label}`}>
          <button type="button" className="cms-editable__tool" onClick={(e) => { stop(e); onEdit(); }}>
            Editar
          </button>
          {onToggleHide ? (
            <button
              type="button"
              className="cms-editable__tool"
              onClick={(e) => {
                stop(e);
                onToggleHide();
              }}
            >
              {unpublished ? "Mostrar" : "Ocultar"}
            </button>
          ) : null}
          {onDelete ? (
            <button
              type="button"
              className="cms-editable__tool cms-editable__tool--danger"
              onClick={(e) => {
                stop(e);
                if (window.confirm(`¿Eliminar «${label}»? Esta acción no se puede deshacer.`)) {
                  onDelete();
                }
              }}
            >
              Eliminar
            </button>
          ) : null}
        </div>
      ) : null}

      <div
        role="button"
        tabIndex={0}
        className="cms-editable__hit"
        onClick={onEdit}
        onKeyDown={handleKey}
        aria-label={`Editar: ${label}`}
      >
        {children}
      </div>
    </div>
  );
}
