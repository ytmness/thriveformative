"use client";

interface AnimatedSectionProps {
  children: React.ReactNode;
  className?: string;
  /** Conservados por compatibilidad; sin animación. */
  delay?: number;
  direction?: "up" | "down" | "left" | "right" | "fade";
}

export default function AnimatedSection({ children, className = "" }: AnimatedSectionProps) {
  return <div className={className}>{children}</div>;
}
