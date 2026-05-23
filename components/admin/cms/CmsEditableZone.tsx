"use client";

import type { KeyboardEvent, ReactNode } from "react";

type Props = {
  label: string;
  children: ReactNode;
  onEdit: () => void;
  className?: string;
  unpublished?: boolean;
};

export default function CmsEditableZone({
  label,
  children,
  onEdit,
  className = "",
  unpublished = false,
}: Props) {
  function handleKey(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onEdit();
    }
  }

  return (
    <div
      role="button"
      tabIndex={0}
      className={`cms-editable cms-editable--block${unpublished ? " cms-editable--unpublished" : ""} ${className}`.trim()}
      onClick={(e) => {
        e.stopPropagation();
        onEdit();
      }}
      onKeyDown={handleKey}
      aria-label={`Editar: ${label}`}
    >
      <span className="cms-editable__badge" aria-hidden>
        Editar
      </span>
      {children}
    </div>
  );
}
