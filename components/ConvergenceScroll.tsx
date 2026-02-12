"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";

interface ConvergenceSectionProps {
  children: React.ReactNode;
  index: number;
  totalSections: number;
  scrollYProgress: ReturnType<typeof useScroll>["scrollYProgress"];
  id?: string;
}

function ConvergenceSection({
  children,
  index,
  totalSections,
  scrollYProgress,
  id,
}: ConvergenceSectionProps) {
  const shouldReduceMotion = useReducedMotion();

  const sectionHeight = 1 / totalSections;
  const approachStart = index * sectionHeight;

  const scale = useTransform(
    scrollYProgress,
    [approachStart, approachStart + sectionHeight * 0.5],
    [0.82, 1]
  );
  const y = useTransform(
    scrollYProgress,
    [approachStart, approachStart + sectionHeight * 0.5],
    [80, 0]
  );
  const opacity = useTransform(
    scrollYProgress,
    [approachStart, approachStart + sectionHeight * 0.35],
    [0.6, 1]
  );

  if (shouldReduceMotion) {
    return (
      <section
        id={id}
        className="convergence-sticky"
        style={{ zIndex: index + 5 }}
      >
        <div className="giant-card-inner">{children}</div>
      </section>
    );
  }

  return (
    <motion.section
      id={id}
      className="convergence-sticky"
      style={{
        scale,
        y,
        opacity,
        zIndex: index + 5,
      }}
    >
      <div className="giant-card-inner">{children}</div>
    </motion.section>
  );
}

export interface ConvergenceSectionData {
  id?: string;
  content: React.ReactNode;
}

interface ConvergenceScrollProps {
  sections: ConvergenceSectionData[];
  totalHeightVh?: number;
}

export default function ConvergenceScroll({
  sections,
  totalHeightVh = 100 * sections.length,
}: ConvergenceScrollProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  return (
    <div
      ref={containerRef}
      className="convergence-container"
      style={{ minHeight: `${totalHeightVh}vh` }}
    >
      {sections.map(({ id, content }, i) => (
        <ConvergenceSection
          key={id ?? i}
          index={i}
          totalSections={sections.length}
          scrollYProgress={scrollYProgress}
          id={id}
        >
          {content}
        </ConvergenceSection>
      ))}
    </div>
  );
}
