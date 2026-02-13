"use client";

import { useMemo, useRef } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";

const FLOR_IMAGES = ["/floral/flor-1.png", "/floral/flor-2.png", "/floral/flor-3.png", "/floral/flor-4.png", "/floral/flor-5.png"];
const FLOWER_SIZES = ["w-13 h-13 md:w-16 md:h-16", "w-10 h-10 md:w-13 md:h-13", "w-16 h-16 md:w-18 md:h-18", "w-12 h-12 md:w-14 md:h-14", "w-9 h-9 md:w-12 md:h-12"];

/* 32 flores (duplicadas) */
const FLOWER_POSITIONS: { side: "left" | "right"; x: string; top: string }[] = [
  { side: "left", x: "4%", top: "8%" },
  { side: "right", x: "4%", top: "12%" },
  { side: "left", x: "10%", top: "28%" },
  { side: "right", x: "10%", top: "35%" },
  { side: "left", x: "18%", top: "52%" },
  { side: "right", x: "18%", top: "58%" },
  { side: "left", x: "26%", top: "18%" },
  { side: "right", x: "26%", top: "78%" },
  { side: "left", x: "34%", top: "72%" },
  { side: "right", x: "34%", top: "42%" },
  { side: "left", x: "42%", top: "38%" },
  { side: "right", x: "42%", top: "88%" },
  { side: "left", x: "46%", top: "92%" },
  { side: "right", x: "46%", top: "22%" },
  { side: "left", x: "48%", top: "62%" },
  { side: "right", x: "48%", top: "5%" },
  { side: "left", x: "6%", top: "45%" },
  { side: "right", x: "6%", top: "65%" },
  { side: "left", x: "14%", top: "12%" },
  { side: "right", x: "14%", top: "88%" },
  { side: "left", x: "22%", top: "68%" },
  { side: "right", x: "22%", top: "32%" },
  { side: "left", x: "30%", top: "35%" },
  { side: "right", x: "30%", top: "72%" },
  { side: "left", x: "38%", top: "5%" },
  { side: "right", x: "38%", top: "95%" },
  { side: "left", x: "44%", top: "82%" },
  { side: "right", x: "44%", top: "18%" },
  { side: "left", x: "47%", top: "28%" },
  { side: "right", x: "47%", top: "52%" },
];

function FlorImage({ variant }: { variant: number }) {
  const src = FLOR_IMAGES[variant % FLOR_IMAGES.length];
  return <img src={src} alt="" className="block w-full h-full object-contain" aria-hidden draggable={false} />;
}

const STAGGER = 0.045; /* Flores: aparición escalonada, más espaciada */

export default function HorizontalCardPath() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(wrapperRef, { once: false, amount: 0.05 });
  const shouldReduceMotion = useReducedMotion();

  const leftFlowers = useMemo(() => FLOWER_POSITIONS.filter((p) => p.side === "left"), []);
  const rightFlowers = useMemo(() => FLOWER_POSITIONS.filter((p) => p.side === "right"), []);

  if (shouldReduceMotion) {
    return (
      <div ref={wrapperRef} className="horizontal-card-path" aria-hidden>
        <div className="horizontal-card-path__side horizontal-card-path__side--left">
          <div className="horizontal-card-path__branches" />
          {leftFlowers.map((pos, i) => (
            <div key={`left-f-${i}`} className={`horizontal-card-path__flower ${FLOWER_SIZES[i % FLOWER_SIZES.length]}`} style={{ left: pos.x, top: pos.top, zIndex: 3 }}>
              <FlorImage variant={i % 5} />
            </div>
          ))}
        </div>
        <div className="horizontal-card-path__side horizontal-card-path__side--right">
          <div className="horizontal-card-path__branches horizontal-card-path__branches--right" />
          {rightFlowers.map((pos, i) => (
            <div key={`right-f-${i}`} className={`horizontal-card-path__flower horizontal-card-path__flower--right ${FLOWER_SIZES[i % FLOWER_SIZES.length]}`} style={{ right: pos.x, top: pos.top, zIndex: 3 }}>
              <FlorImage variant={i % 5} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div ref={wrapperRef} className="horizontal-card-path" aria-hidden>
      {/* Izquierda: ramas crecen desde el borde izquierdo hacia el centro */}
      <motion.div
        className="horizontal-card-path__side horizontal-card-path__side--left"
        initial={{ opacity: 0, scaleX: 0 }}
        animate={isInView ? { opacity: 1, scaleX: 1 } : { opacity: 0, scaleX: 0 }}
        transition={{ duration: 1.4, ease: [0.22, 0.61, 0.36, 1] }}
        style={{ transformOrigin: "left center" }}
      >
        <div className="horizontal-card-path__branches" />
        {leftFlowers.map((pos, i) => (
          <motion.div
            key={`left-f-${i}`}
            className={`horizontal-card-path__flower ${FLOWER_SIZES[i % FLOWER_SIZES.length]}`}
            style={{ left: pos.x, top: pos.top, zIndex: 3 }}
            initial={{ opacity: 0, scale: 0.2, rotate: 540 }}
            animate={isInView ? { opacity: 1, scale: 1, rotate: 0 } : { opacity: 0, scale: 0.2, rotate: 540 }}
            transition={{
              duration: 0.95,
              delay: isInView ? Math.min(i * STAGGER, 2) : 0,
              ease: [0.22, 0.61, 0.36, 1],
            }}
          >
            <FlorImage variant={i % 5} />
          </motion.div>
        ))}
      </motion.div>

      {/* Derecha: ramas crecen desde el borde derecho hacia el centro — se unen en medio */}
      <motion.div
        className="horizontal-card-path__side horizontal-card-path__side--right"
        initial={{ opacity: 0, scaleX: 0 }}
        animate={isInView ? { opacity: 1, scaleX: 1 } : { opacity: 0, scaleX: 0 }}
        transition={{ duration: 1.4, ease: [0.22, 0.61, 0.36, 1] }}
        style={{ transformOrigin: "right center" }}
      >
        <div className="horizontal-card-path__branches horizontal-card-path__branches--right" />
        {rightFlowers.map((pos, i) => (
          <motion.div
            key={`right-f-${i}`}
            className={`horizontal-card-path__flower horizontal-card-path__flower--right ${FLOWER_SIZES[i % FLOWER_SIZES.length]}`}
            style={{ right: pos.x, top: pos.top, zIndex: 3 }}
            initial={{ opacity: 0, scale: 0.2, rotate: -540 }}
            animate={isInView ? { opacity: 1, scale: 1, rotate: 0 } : { opacity: 0, scale: 0.2, rotate: -540 }}
            transition={{
              duration: 0.95,
              delay: isInView ? Math.min(i * STAGGER + 0.12, 2.2) : 0,
              ease: [0.22, 0.61, 0.36, 1],
            }}
          >
            <FlorImage variant={i % 5} />
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
