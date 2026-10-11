"use client";

import Link from "next/link";
import { X } from "lucide-react";
import { useAdminEnglish } from "@/components/admin/clinic/ClinicScope";

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
  tour,
}: {
  items: { id: string; label: string }[];
  value: string;
  onChange: (id: string) => void;
  errors?: Record<string, boolean>;
  label: string;
  tour?: string;
}) {
  const english = useAdminEnglish();
  return (
    <nav className="admin-nav admin-nav--row" aria-label={label} data-tour={tour}>
      {items.map((item) => (
        <button key={item.id} type="button" aria-pressed={value === item.id} className={`admin-nav__item${value === item.id ? " admin-nav__item--active" : ""}`} onClick={() => onChange(item.id)}>
          {item.label}
          {errors?.[item.id] ? <span className="admin-tab-dot" aria-label={english ? "Has errors" : "Con errores"} /> : null}
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
  tour,
}: {
  items: { id: string; label: string }[];
  value: string;
  onChange: (id: string) => void;
  label: string;
  tour?: string;
}) {
  return (
    <nav className="admin-nav admin-nav--row" aria-label={label} data-tour={tour}>
      {items.map((item) => (
        <button key={item.id} type="button" aria-pressed={value === item.id} className={`admin-nav__item${value === item.id ? " admin-nav__item--active" : ""}`} onClick={() => onChange(item.id)}>
          {item.label}
        </button>
      ))}
    </nav>
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
  const english = useAdminEnglish();
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
      {!rows.length ? empty || <EmptyState title={english ? "No records" : "Sin registros"} /> : null}
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
  hrefLabel,
  onClose,
}: {
  message: string;
  href?: string;
  hrefLabel?: string;
  onClose: () => void;
}) {
  const english = useAdminEnglish();
  return (
    <div className="admin-toast" role="status">
      <span>{message}</span>
      {href ? <Link href={href}>{hrefLabel || (english ? "Open chart" : "Ver ficha")}</Link> : null}
      <button type="button" className="admin-btn admin-btn--ghost" onClick={onClose} aria-label={english ? "Close notice" : "Cerrar aviso"}>
        <X size={16} />
      </button>
    </div>
  );
}

export function CloseButton({ onClick }: { onClick: () => void }) {
  const english = useAdminEnglish();
  return (
    <button type="button" className="admin-icon-btn" onClick={onClick} aria-label={english ? "Close" : "Cerrar"}>
      <X size={18} />
    </button>
  );
}
