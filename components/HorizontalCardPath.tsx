"use client";

import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";

const RAMA_1 = "/floral/rama-1.png";
const RAMA_2 = "/floral/rama-2.png";
const RAMA_5 = "/floral/rama-5.png";
const HORIZONTAL_RAMAS = [RAMA_1, RAMA_2, RAMA_5];
/* Repetir para formar camino más largo desde borde hasta centro */
const PATH_SEGMENTS = [...HORIZONTAL_RAMAS, ...HORIZONTAL_RAMAS, RAMA_1];

function RamaSegment({ src, index }: { src: string; index: number }) {
  return (
    <div className="horizontal-path-segment flex-shrink-0">
      <img src={src} alt="" className="block w-full h-full object-contain" aria-hidden draggable={false} />
    </div>
  );
}

export default function HorizontalCardPath() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(wrapperRef, { once: false, amount: 0.1 });
  const shouldReduceMotion = useReducedMotion();

  const closedLeft = shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scaleX: 0 };
  const openLeft = { opacity: 1, scaleX: 1 };
  const closedRight = shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scaleX: 0 };
  const openRight = { opacity: 1, scaleX: 1 };

  return (
    <div ref={wrapperRef} className="horizontal-card-path" aria-hidden>
      <motion.div
        className="horizontal-path-side horizontal-path-left"
        initial={closedLeft}
        animate={isInView ? openLeft : closedLeft}
        transition={{
          duration: shouldReduceMotion ? 0.25 : 0.55,
          ease: [0.22, 0.61, 0.36, 1],
        }}
      >
        {PATH_SEGMENTS.map((src, i) => (
          <RamaSegment key={`left-${i}`} src={src} index={i} />
        ))}
      </motion.div>
      <motion.div
        className="horizontal-path-side horizontal-path-right"
        initial={closedRight}
        animate={isInView ? openRight : closedRight}
        transition={{
          duration: shouldReduceMotion ? 0.25 : 0.55,
          ease: [0.22, 0.61, 0.36, 1],
        }}
      >
        {PATH_SEGMENTS.map((src, i) => (
          <RamaSegment key={`right-${i}`} src={src} index={i} />
        ))}
      </motion.div>
    </div>
  );
}
