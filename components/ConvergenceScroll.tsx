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
  const height = totalHeightVh ?? 140 * n;

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
  const start = index / total;
  const end = (index + 1) / total;
  const mid = start + (end - start) * 0.5;

  const opacity = useTransform(progress, [start, mid, end], [0, 1, 0]);
  const y = useTransform(progress, [start, mid, end], [60, 0, -24]);
  const scale = useTransform(progress, [start, mid, end], [0.92, 1.02, 1.06]);
  const blur = useTransform(progress, [start, mid, end], [10, 0, 10]);
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
