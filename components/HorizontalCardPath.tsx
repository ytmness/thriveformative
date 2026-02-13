"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useInView, useReducedMotion, useScroll, useMotionValueEvent } from "framer-motion";

const RAMA_1 = "/floral/rama-1.png";
const RAMA_2 = "/floral/rama-2.png";
const RAMA_5 = "/floral/rama-5.png";
const RAMAS_HORIZONTAL = [RAMA_1, RAMA_2, RAMA_5];
const FLOR_IMAGES = ["/floral/flor-1.png", "/floral/flor-2.png", "/floral/flor-3.png", "/floral/flor-4.png", "/floral/flor-5.png"];
const FLOWER_SIZES = ["w-13 h-13 md:w-16 md:h-16", "w-10 h-10 md:w-13 md:h-13", "w-16 h-16 md:w-18 md:h-18", "w-12 h-12 md:w-14 md:h-14", "w-9 h-9 md:w-12 md:h-12"];

type OrnamentType = "branch" | "branchCorner" | "flower";

interface OrnamentDef {
  type: OrnamentType;
  size: string;
  left?: string;
  right?: string;
  top?: string;
  bottom?: string;
  zIndex: number;
  mirror?: boolean;
  orderKey: number;
  ramaVariant?: 0 | 1 | 2;
  florVariant?: number;
}

function generateHorizontalOrnaments(): OrnamentDef[] {
  const items: OrnamentDef[] = [];
  let orderKey = 0;
  const NUM_SEGMENTS = 14;

  /* Izquierda: ramas 1,2,5 desde borde hasta centro */
  for (let i = 0; i < NUM_SEGMENTS; i++) {
    const leftPct = -5 + i * 4;
    const variant: 0 | 1 | 2 = (i % 3) as 0 | 1 | 2;
    items.push({
      type: "branch",
      size: "w-36 md:w-52 h-[286px] md:h-[364px]",
      left: `${leftPct}%`,
      top: "50%",
      zIndex: 1,
      mirror: false,
      orderKey: orderKey++,
      ramaVariant: variant,
    });
  }

  /* Derecha: ramas desde borde hasta centro */
  for (let i = 0; i < NUM_SEGMENTS; i++) {
    const rightPct = -5 + i * 4;
    const variant: 0 | 1 | 2 = ((i + 1) % 3) as 0 | 1 | 2;
    items.push({
      type: "branch",
      size: "w-36 md:w-52 h-[286px] md:h-[364px]",
      right: `${rightPct}%`,
      top: "50%",
      zIndex: 1,
      mirror: true,
      orderKey: orderKey++,
      ramaVariant: variant,
    });
  }

  /* Esquinas */
  items.push({ type: "branchCorner", size: "w-42 h-42 md:w-58 md:h-58", left: "0", top: "0", zIndex: 0, orderKey: orderKey++, ramaVariant: 0 });
  items.push({ type: "branchCorner", size: "w-36 h-36 md:w-52 md:h-52", right: "0", top: "0", zIndex: 0, orderKey: orderKey++, ramaVariant: 1 });
  items.push({ type: "branchCorner", size: "w-36 h-36 md:w-50 md:h-50", left: "0", bottom: "0", zIndex: 0, orderKey: orderKey++, ramaVariant: 2 });
  items.push({ type: "branchCorner", size: "w-36 h-36 md:w-50 md:h-50", right: "0", bottom: "0", zIndex: 0, orderKey: orderKey++, ramaVariant: 0 });

  /* Flores — misma densidad que laterales */
  const flowerPositions = [
    { side: "left" as const, left: "2%", top: "5%" },
    { side: "right" as const, right: "2%", top: "10%" },
    { side: "left" as const, left: "8%", top: "18%" },
    { side: "right" as const, right: "8%", top: "22%" },
    { side: "left" as const, left: "15%", top: "8%" },
    { side: "right" as const, right: "15%", top: "35%" },
    { side: "left" as const, left: "22%", top: "42%" },
    { side: "right" as const, right: "22%", top: "12%" },
    { side: "left" as const, left: "30%", top: "65%" },
    { side: "right" as const, right: "30%", top: "55%" },
    { side: "left" as const, left: "38%", top: "25%" },
    { side: "right" as const, right: "38%", top: "78%" },
    { side: "left" as const, left: "46%", top: "88%" },
    { side: "right" as const, right: "46%", top: "32%" },
    { side: "left" as const, left: "52%", top: "45%" },
    { side: "right" as const, right: "52%", top: "92%" },
  ];
  flowerPositions.forEach((pos, i) => {
    items.push({
      type: "flower",
      size: FLOWER_SIZES[i % FLOWER_SIZES.length],
      ...(pos.side === "left" ? { left: pos.left } : { right: pos.right }),
      top: pos.top,
      zIndex: 3,
      orderKey: orderKey++,
      florVariant: i % 5,
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

function RamaImage({ variant, alignBottom = false }: { variant: 0 | 1 | 2; alignBottom?: boolean }) {
  const src = RAMAS_HORIZONTAL[variant % RAMAS_HORIZONTAL.length];
  return (
    <img
      src={src}
      alt=""
      className={`block w-full h-full object-contain ${alignBottom ? "object-bottom" : "object-top"}`}
      aria-hidden
      draggable={false}
    />
  );
}

const STAGGER_BASE = 0.008;
const STAGGER_MAX = 1.2;

function useScrollDirection() {
  const [direction, setDirection] = useState<"down" | "up">("down");
  const { scrollY } = useScroll();
  const prev = useRef(0);

  useMotionValueEvent(scrollY, "change", (v) => {
    setDirection(v > prev.current ? "down" : "up");
    prev.current = v;
  });

  return direction;
}

export default function HorizontalCardPath() {
  const [mounted, setMounted] = useState(false);
  const ornaments = useMemo(() => generateHorizontalOrnaments(), []);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(wrapperRef, { once: false, amount: 0.1 });
  const scrollDirection = useScrollDirection();
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => setMounted(true), []);

  const effectiveInView = mounted && isInView;
  const effectiveReduceMotion = mounted && !!shouldReduceMotion;
  const fromY = mounted ? (scrollDirection === "down" ? 30 : -30) : 30;

  const closedLeft = effectiveReduceMotion ? { opacity: 0 } : { opacity: 0, scaleX: 0 };
  const openLeft = { opacity: 1, scaleX: 1 };
  const closedRight = effectiveReduceMotion ? { opacity: 0 } : { opacity: 0, scaleX: 0 };
  const openRight = { opacity: 1, scaleX: 1 };

  const leftOrnaments = ornaments.filter((o) => o.left !== undefined);
  const rightOrnaments = ornaments.filter((o) => o.right !== undefined);

  const renderOrnament = (item: OrnamentDef, side: "left" | "right", index: number) => {
    const isRightSide = side === "right";
    const needsMirror = item.mirror && item.type !== "branch" && item.type !== "branchCorner";
    const isFlower = item.type === "flower";
    const staggerDelay = Math.min(index * STAGGER_BASE, STAGGER_MAX);

    const hiddenState = effectiveReduceMotion
      ? { opacity: 0 }
      : { opacity: 0, y: fromY, scale: isFlower ? 0 : 0.8, rotate: isFlower ? 360 : 0 };
    const visibleState = { opacity: 1, y: 0, scale: 1, rotate: 0 };

    return (
      <motion.div
        key={`${side}-${item.type}-${item.orderKey}`}
        className={`horizontal-path-ornament floral-ornament--${item.type} ${isRightSide ? "floral-ornament--right" : ""} ${item.size}`}
        style={{
          left: item.left,
          right: item.right,
          top: item.top,
          bottom: item.bottom,
          zIndex: item.zIndex,
        }}
        initial={hiddenState}
        animate={effectiveInView ? visibleState : hiddenState}
        transition={{
          duration: effectiveReduceMotion ? 0.3 : isFlower ? 0.6 : 0.5 + (index % 3) * 0.06,
          delay: effectiveInView ? (effectiveReduceMotion ? 0 : staggerDelay) : 0,
          ease: [0.22, 0.61, 0.36, 1],
        }}
      >
        <div className={`w-full h-full ${needsMirror ? "floral-ornament-mirror" : ""}`}>
          {isFlower ? (
            <FlorImage variant={item.florVariant ?? 0} />
          ) : (
            <RamaImage
              variant={item.ramaVariant ?? 0}
              alignBottom={item.type === "branchCorner" && item.bottom !== undefined}
            />
          )}
        </div>
      </motion.div>
    );
  };

  return (
    <div ref={wrapperRef} className="horizontal-card-path" aria-hidden>
      <motion.div
        className="horizontal-path-side horizontal-path-left"
        initial={closedLeft}
        animate={effectiveInView ? openLeft : closedLeft}
        transition={{
          duration: effectiveReduceMotion ? 0.25 : 0.55,
          ease: [0.22, 0.61, 0.36, 1],
        }}
      >
        {leftOrnaments.map((item, i) => renderOrnament(item, "left", i))}
      </motion.div>
      <motion.div
        className="horizontal-path-side horizontal-path-right"
        initial={closedRight}
        animate={effectiveInView ? openRight : closedRight}
        transition={{
          duration: effectiveReduceMotion ? 0.25 : 0.55,
          ease: [0.22, 0.61, 0.36, 1],
        }}
      >
        {rightOrnaments.map((item, i) => renderOrnament(item, "right", i))}
      </motion.div>
    </div>
  );
}
