"use client";

import Link from "next/link";
import { X } from "lucide-react";

export function FormField({
  label,
  required,
  hint,
  error,
  children,
  className = "",
}: {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`admin-field${className ? ` ${className}` : ""}`}>
      <span className="admin-field__label">
        {label}
        {required ? <span className="admin-req"> *</span> : null}
      </span>
      {children}
      {error ? <span className="admin-field__error">{error}</span> : null}
      {hint && !error ? <span className="admin-field__hint">{hint}</span> : null}
    </label>
  );
}

export function Button({
  variant = "secondary",
  type = "button",
  children,
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "danger" | "ghost" }) {
  const name = variant === "secondary" ? "admin-btn" : `admin-btn admin-btn--${variant}`;
  return (
    <button type={type} className={`${name}${className ? ` ${className}` : ""}`} {...props}>
      {children}
    </button>
  );
}

export function Tabs({
  items,
  value,
  onChange,
  errors,
  label,
}: {
  items: { id: string; label: string }[];
  value: string;
  onChange: (id: string) => void;
  errors?: Record<string, boolean>;
  label: string;
}) {
  return (
    <nav className="admin-tabs admin-tabs--line" aria-label={label}>
      {items.map((item) => (
        <button key={item.id} type="button" className={value === item.id ? "is-active" : ""} onClick={() => onChange(item.id)}>
          {item.label}
          {errors?.[item.id] ? <span className="admin-tab-dot" aria-label="Con errores" /> : null}
        </button>
      ))}
    </nav>
  );
}

export function SegmentedControl({
  items,
  value,
  onChange,
  label,
}: {
  items: { id: string; label: string }[];
  value: string;
  onChange: (id: string) => void;
  label: string;
}) {
  return (
    <div className="admin-segment" role="tablist" aria-label={label}>
      {items.map((item) => (
        <button key={item.id} type="button" role="tab" aria-selected={value === item.id} className={value === item.id ? "is-active" : ""} onClick={() => onChange(item.id)}>
          {item.label}
        </button>
      ))}
    </div>
  );
}

export function DataTable({
  columns,
  rows,
  empty,
}: {
  columns: string[];
  rows: React.ReactNode[][];
  empty?: React.ReactNode;
}) {
  return (
    <div className="admin-table-wrap">
      <div className="admin-table__row admin-table__head" style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` }}>
        {columns.map((column) => <span key={column}>{column}</span>)}
      </div>
      {rows.map((cells, index) => (
        <div key={index} className="admin-table__row" style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` }}>
          {cells.map((cell, cellIndex) => <div key={cellIndex}>{cell}</div>)}
        </div>
      ))}
      {!rows.length ? empty || <EmptyState title="Sin registros" /> : null}
    </div>
  );
}

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`admin-card${className ? ` ${className}` : ""}`}>{children}</section>;
}

export function EmptyState({ title, text, action }: { title: string; text?: string; action?: React.ReactNode }) {
  return (
    <div className="admin-empty">
      <span className="admin-empty__mark" aria-hidden>○</span>
      <p className="admin-empty__title">{title}</p>
      {text ? <p className="admin-empty__text">{text}</p> : null}
      {action}
    </div>
  );
}

export function Toast({
  message,
  href,
  hrefLabel = "Ver ficha",
  onClose,
}: {
  message: string;
  href?: string;
  hrefLabel?: string;
  onClose: () => void;
}) {
  return (
    <div className="admin-toast" role="status">
      <span>{message}</span>
      {href ? <Link href={href}>{hrefLabel}</Link> : null}
      <button type="button" className="admin-btn admin-btn--ghost" onClick={onClose} aria-label="Cerrar aviso">
        <X size={16} />
      </button>
    </div>
  );
}

export function CloseButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" className="admin-icon-btn" onClick={onClick} aria-label="Cerrar">
      <X size={18} />
    </button>
  );
}
