"use client";

import FloralSideOrnaments from "./FloralSideOrnaments";

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
}

export default function GiantScrollCard({
  children,
  className = "",
  id,
}: GiantScrollCardProps) {
  return (
    <article id={id} className={`giant-card ${className}`}>
      <div className="giant-card-inner">
        {children}
        <FloralSideOrnaments />
      </div>
    </article>
  );
}
