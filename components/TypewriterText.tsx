"use client";

import { useEffect, useRef, useState } from "react";
import { useInView } from "framer-motion";

interface TypewriterTextProps {
  text: string;
  speed?: number;
  delay?: number;
  active?: boolean;
  onComplete?: () => void;
  className?: string;
  as?: "span" | "p" | "h2" | "div";
}

export default function TypewriterText({
  text,
  speed = 45,
  delay = 0,
  active = true,
  onComplete,
  className = "",
  as: Tag = "span",
}: TypewriterTextProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });
  const [visibleLength, setVisibleLength] = useState(0);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (!isInView || !active || text.length === 0) return;

    const startTime = Date.now() + delay;
    let rafId: number;

    const tick = () => {
      const elapsed = Date.now() - startTime;
      if (elapsed < 0) {
        rafId = requestAnimationFrame(tick);
        return;
      }
      const charsToShow = Math.min(Math.floor(elapsed / speed), text.length);
      setVisibleLength(charsToShow);
      if (charsToShow < text.length) {
        rafId = requestAnimationFrame(tick);
      } else {
        onCompleteRef.current?.();
      }
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [isInView, active, text, speed, delay]);

  const displayed = isInView ? text.slice(0, visibleLength) : "";
  const isTyping = visibleLength < text.length;

  return (
    <div ref={ref} className="relative">
      {/* Espacio reservado: texto completo invisible para evitar que crezca el recuadro */}
      <Tag className={`${className} invisible`} aria-hidden>
        {text}
      </Tag>
      {/* Contenido visible encima, sin afectar el layout */}
      <Tag className={`${className} absolute top-0 left-0`}>
        {displayed}
        {isTyping && isInView && (
          <span className="inline-block w-[2px] h-[0.9em] align-baseline ml-0.5 bg-current animate-pulse" aria-hidden />
        )}
      </Tag>
    </div>
  );
}
