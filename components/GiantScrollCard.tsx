"use client";

type CardVariant =
  | "slideUp"
  | "slideLeft"
  | "slideRight"
  | "scale"
  | "curtain"
  | "blur"
  | "stack";

interface GiantScrollCardProps {
  children: React.ReactNode;
  /** Conservado por compatibilidad con la página; sin efecto visual. */
  variant?: CardVariant;
  className?: string;
  id?: string;
  noFade?: boolean;
  /** Menos padding vertical (p. ej. bloques Medicina / Acompañamiento). */
  compact?: boolean;
}

export default function GiantScrollCard({
  children,
  className = "",
  id,
  compact = false,
}: GiantScrollCardProps) {
  return (
    <article id={id} className={`giant-card${compact ? " giant-card--compact" : ""} ${className}`.trim()}>
      <div className="giant-card-inner">
        {children}
      </div>
    </article>
  );
}
