"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";

const RAMA_1 = "/floral/rama-1.png";
const RAMA_2 = "/floral/rama-2.png";
const RAMA_5 = "/floral/rama-5.png";
const FLOR_IMAGES = ["/floral/flor-1.png", "/floral/flor-2.png", "/floral/flor-3.png", "/floral/flor-4.png", "/floral/flor-5.png"];
// Mismo tamaño que FloralSideOrnaments (laterales)
const FLOWER_SIZES = ["w-13 h-13 md:w-16 md:h-16", "w-10 h-10 md:w-13 md:h-13", "w-16 h-16 md:w-18 md:h-18", "w-12 h-12 md:w-14 md:h-14", "w-9 h-9 md:w-12 md:h-12"];

type OrnamentType = "branch" | "flower";

interface OrnamentDef {
  type: OrnamentType;
  size: string;
  left?: string;
  right?: string;
  top?: string;
  zIndex: number;
  mirror?: boolean;
  orderKey: number;
  ramaVariant?: 0 | 1 | 2;
  florVariant?: number;
  side: "left" | "right";
}

/* Densidad: ~1 rama cada 300–400px en eje X, superposición para cierre en centro */
const SEGMENTS_LEFT = 14;
const SEGMENTS_RIGHT = 14;

function generateHorizontalOrnaments(): OrnamentDef[] {
  const items: OrnamentDef[] = [];
  let orderKey = 0;

  /* Izquierda: ramas desde borde hasta más allá del centro (se cierra) */
  for (let i = 0; i < SEGMENTS_LEFT; i++) {
    const leftPct = -3 + i * 8.5; /* -3% a ~118% → solapa en centro */
    const variant: 0 | 1 | 2 = (i % 3) as 0 | 1 | 2;
    items.push({
      type: "branch",
      size: "horizontal-path-branch",
      left: `${leftPct}%`,
      top: "50%",
      zIndex: 1,
      mirror: false,
      orderKey: orderKey++,
      ramaVariant: variant,
      side: "left",
    });
  }

  /* Derecha: ramas desde borde hasta más allá del centro */
  for (let i = 0; i < SEGMENTS_RIGHT; i++) {
    const rightPct = -3 + i * 8.5;
    const variant: 0 | 1 | 2 = ((i + 1) % 3) as 0 | 1 | 2;
    items.push({
      type: "branch",
      size: "horizontal-path-branch",
      right: `${rightPct}%`,
      top: "50%",
      zIndex: 1,
      mirror: true,
      orderKey: orderKey++,
      ramaVariant: variant,
      side: "right",
    });
  }

  /* Flores — distribuidas en ambos lados y centro */
  const flowerPositions: { side: "left" | "right"; x: string; top: string }[] = [
    { side: "left", x: "5%", top: "20%" },
    { side: "right", x: "5%", top: "75%" },
    { side: "left", x: "18%", top: "65%" },
    { side: "right", x: "18%", top: "25%" },
    { side: "left", x: "28%", top: "35%" },
    { side: "right", x: "28%", top: "88%" },
    { side: "left", x: "38%", top: "80%" },
    { side: "right", x: "38%", top: "42%" },
    { side: "left", x: "48%", top: "55%" },
    { side: "right", x: "48%", top: "62%" },
    { side: "left", x: "58%", top: "28%" },
    { side: "right", x: "58%", top: "78%" },
    { side: "left", x: "72%", top: "70%" },
    { side: "right", x: "72%", top: "35%" },
  ];
  flowerPositions.forEach((pos, i) => {
    items.push({
      type: "flower",
      size: FLOWER_SIZES[i % FLOWER_SIZES.length],
      ...(pos.side === "left" ? { left: pos.x } : { right: pos.x }),
      top: pos.top,
      zIndex: 2,
      orderKey: orderKey++,
      florVariant: i % 5,
      side: pos.side,
    });
  });

  return items;
}

function FlorImage({ variant }: { variant: number }) {
  const src = FLOR_IMAGES[variant % FLOR_IMAGES.length];
  return (
    <img src={src} alt="" className="block w-full h-full object-contain" aria-hidden draggable={false} />
  );
}

function RamaImage({ variant }: { variant: 0 | 1 | 2 }) {
  const src = [RAMA_1, RAMA_2, RAMA_5][variant % 3];
  return (
    <img src={src} alt="" className="block w-full h-full object-contain object-center" aria-hidden draggable={false} />
  );
}

const STAGGER_BASE = 0.006;
const STAGGER_MAX = 0.9;

export default function HorizontalCardPath() {
  const [mounted, setMounted] = useState(false);
  const ornaments = useMemo(() => generateHorizontalOrnaments(), []);
  const wrapperRef = useRef<HTMLDivElement>(null);
  /* amount bajo (2%): animación en todos los paths al entrar, sin quedarse estático */
  const isInView = useInView(wrapperRef, { once: false, amount: 0.02 });
  const shouldReduceMotion = useReducedMotion();
  useEffect(() => setMounted(true), []);

  const effectiveInView = mounted && isInView;
  const effectiveReduceMotion = mounted && !!shouldReduceMotion;

  /* Animación abrir/cerrar: al entrar se abre (scaleX 1), al salir se cierra (scaleX 0) */
  const leftClosed = effectiveReduceMotion ? { opacity: 0 } : { opacity: 0, scaleX: 0 };
  const leftOpen = { opacity: 1, scaleX: 1 };
  const rightClosed = effectiveReduceMotion ? { opacity: 0 } : { opacity: 0, scaleX: 0 };
  const rightOpen = { opacity: 1, scaleX: 1 };

  const leftOrnaments = ornaments.filter((o) => o.side === "left");
  const rightOrnaments = ornaments.filter((o) => o.side === "right");

  const renderOrnament = (item: OrnamentDef, side: "left" | "right", index: number) => {
    const isRightSide = side === "right";
    const needsMirror = item.mirror && item.type === "flower";
    const isFlower = item.type === "flower";
    const staggerDelay = Math.min(index * STAGGER_BASE, STAGGER_MAX);

    const hiddenState = effectiveReduceMotion
      ? { opacity: 0 }
      : { opacity: 0, scale: isFlower ? 0 : 0.9 };
    const visibleState = { opacity: 1, scale: 1 };

    return (
      <motion.div
        key={`${side}-${item.type}-${item.orderKey}`}
        className={`horizontal-path-ornament ${item.size} ${isRightSide ? "horizontal-path-ornament--right" : ""}`}
        style={{
          left: item.left,
          right: item.right,
          top: item.top,
          zIndex: item.zIndex,
        }}
        initial={hiddenState}
        animate={effectiveInView ? visibleState : hiddenState}
        transition={{
          duration: effectiveReduceMotion ? 0.25 : isFlower ? 0.45 : 0.4 + (index % 2) * 0.04,
          delay: effectiveInView ? (effectiveReduceMotion ? 0 : staggerDelay) : 0,
          ease: [0.22, 0.61, 0.36, 1],
        }}
      >
        <div className={`w-full h-full ${needsMirror ? "floral-ornament-mirror" : ""}`}>
          {isFlower ? (
            <FlorImage variant={item.florVariant ?? 0} />
          ) : (
            <RamaImage variant={item.ramaVariant ?? 0} />
          )}
        </div>
      </motion.div>
    );
  };

  return (
    <div ref={wrapperRef} className="horizontal-card-path" aria-hidden>
      {/* Lado izquierdo — se abre desde la izquierda */}
      <motion.div
        className="horizontal-path-side horizontal-path-left"
        initial={leftClosed}
        animate={effectiveInView ? leftOpen : leftClosed}
        transition={{
          duration: effectiveReduceMotion ? 0.2 : 0.5,
          ease: [0.22, 0.61, 0.36, 1],
        }}
      >
        {leftOrnaments.map((item, i) => renderOrnament(item, "left", i))}
      </motion.div>
      {/* Lado derecho — se abre desde la derecha */}
      <motion.div
        className="horizontal-path-side horizontal-path-right"
        initial={rightClosed}
        animate={effectiveInView ? rightOpen : rightClosed}
        transition={{
          duration: effectiveReduceMotion ? 0.2 : 0.5,
          ease: [0.22, 0.61, 0.36, 1],
        }}
      >
        {rightOrnaments.map((item, i) => renderOrnament(item, "right", i))}
      </motion.div>
    </div>
  );
}
