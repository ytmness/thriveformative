"use client";

import React, { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";

export interface ConvergenceSectionData {
  id?: string;
  content: React.ReactNode;
}

interface ConvergenceScrollProps {
  sections: ConvergenceSectionData[];
  /** Total scroll length (vh). Higher = more "cinematic". */
  totalHeightVh?: number;
}

/**
 * ConvergenceScroll v2 — efecto cámara
 *
 * Objetivo: que sientas que el contenido viene hacia ti (stage fijo tipo cámara)
 * en lugar de hacer scroll tradicional hacia abajo.
 *
 * Técnica:
 * - Un solo stage sticky (100vh) que permanece fijo
 * - Todas las secciones son capas absolutas apiladas
 * - El scroll hace crossfade + scale/translate de cada capa "hacia" el espectador
 */
export default function ConvergenceScroll({
  sections,
  totalHeightVh,
}: ConvergenceScrollProps) {
  const reduce = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const n = Math.max(1, sections.length);
  const height = totalHeightVh ?? 95 * n;

  return (
    <div
      ref={containerRef}
      className="convergence-container"
      style={{ minHeight: `${height}vh` }}
    >
      <div className="convergence-stage">
        {sections.map(({ id, content }, i) => (
          <Layer
            key={id ?? i}
            id={id}
            index={i}
            total={n}
            progress={scrollYProgress}
            reduce={!!reduce}
          >
            {content}
          </Layer>
        ))}
      </div>
    </div>
  );
}

function Layer({
  id,
  index,
  total,
  progress,
  reduce,
  children,
}: {
  id?: string;
  index: number;
  total: number;
  progress: ReturnType<typeof useScroll>["scrollYProgress"];
  reduce: boolean;
  children: React.ReactNode;
}) {
  const step = 1 / total;
  const overlap = step * 0.35;
  const start = Math.max(0, index * step - overlap);
  const midIn = index * step + step * 0.15;
  const midOut = (index + 1) * step - step * 0.15;
  const end = Math.min(1, (index + 1) * step + overlap);

  const opacityIn = index === 0 ? 0.92 : 0;
  const opacity = useTransform(
    progress,
    [start, midIn, midOut, end],
    [opacityIn, 1, 1, 0]
  );
  const y = useTransform(progress, [start, midIn, end], [50, 0, -20]);
  const scale = useTransform(progress, [start, midIn, end], [0.94, 1, 1.02]);
  const blur = useTransform(progress, [start, midIn, midOut, end], [8, 0, 0, 6]);
  const filter = useTransform(blur, (v) => `blur(${v}px)`);

  if (reduce) {
    return (
      <section id={id} className="convergence-layer" style={{ zIndex: index + 1 }}>
        <div className="giant-card-inner">{children}</div>
      </section>
    );
  }

  return (
    <motion.section
      id={id}
      className="convergence-layer"
      style={{
        zIndex: index + 1,
        opacity,
        y,
        scale,
        filter,
      }}
    >
      <div className="giant-card-inner">{children}</div>
    </motion.section>
  );
}
