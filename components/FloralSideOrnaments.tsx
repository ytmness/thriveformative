"use client";

import { useMemo, useRef } from "react";
import { motion, useReducedMotion, useInView } from "framer-motion";
import { useScrollDirection } from "@/lib/useScrollDirection";
import { LATERAL } from "@/lib/lateralAnimation";

/* ───────────────────────────────────────────
   Camino entre ramas + flores por encima
   ─────────────────────────────────────────── */

const RAMA_3 = "/floral/rama-3.png";
const RAMA_4 = "/floral/rama-4.png";
const FLOR_IMAGES = ["/floral/flor-1.png", "/floral/flor-2.png", "/floral/flor-3.png", "/floral/flor-4.png", "/floral/flor-5.png"];

function FlorImage({ variant }: { variant: number }) {
  const src = FLOR_IMAGES[variant % FLOR_IMAGES.length];
  return (
    <img src={src} alt="" className="block w-full h-full object-contain" aria-hidden draggable={false} />
  );
}

function RamaImage({ variant, alignBottom = false }: { variant: 2 | 3; alignBottom?: boolean }) {
  const src = variant === 2 ? RAMA_3 : RAMA_4;
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
  ramaVariant?: 2 | 3;
  florVariant?: number;
}

function generateOrnaments(): OrnamentDef[] {
  const items: OrnamentDef[] = [];
  let orderKey = 0;

  const NUM_SEGMENTS = 16; /* ramas seguidas y unidas hacia abajo */

  /* Izquierda: ramas un poco más hacia la orilla */
  for (let i = 0; i < NUM_SEGMENTS; i++) {
    const topPct = -8 + i * 6.5;
    const variant: 2 | 3 = i % 2 === 0 ? 2 : 3;
    items.push({
      type: "branch",
      size: "w-36 md:w-52 h-[286px] md:h-[364px]",
      left: "-4rem",
      top: `${topPct}%`,
      zIndex: 1,
      mirror: false,
      orderKey: orderKey++,
      ramaVariant: variant,
    });
  }

  /* Derecha: ramas más hacia la orilla (alineadas con las flores) */
  for (let i = 0; i < NUM_SEGMENTS; i++) {
    const topPct = -8 + i * 6.5;
    const variant: 2 | 3 = i % 2 === 0 ? 3 : 2;
    items.push({
      type: "branch",
      size: "w-36 md:w-52 h-[286px] md:h-[364px]",
      right: "-4rem",
      top: `${topPct}%`,
      zIndex: 1,
      mirror: true,
      orderKey: orderKey++,
      ramaVariant: variant,
    });
  }

  /* Esquinas — 30% más grandes */
  items.push({ type: "branchCorner", size: "w-42 h-42 md:w-58 md:h-58", left: "-3.5rem", top: "0", zIndex: 0, orderKey: orderKey++, ramaVariant: 2 });
  items.push({ type: "branchCorner", size: "w-36 h-36 md:w-52 md:h-52", right: "-4rem", top: "0", zIndex: 0, orderKey: orderKey++, ramaVariant: 3 });
  items.push({ type: "branchCorner", size: "w-36 h-36 md:w-50 md:h-50", left: "-3.5rem", bottom: "0", zIndex: 0, orderKey: orderKey++, ramaVariant: 2 });
  items.push({ type: "branchCorner", size: "w-36 h-36 md:w-50 md:h-50", right: "-4rem", bottom: "0", zIndex: 0, orderKey: orderKey++, ramaVariant: 3 });

  /* Flores — izquierda más hacia la orilla, derecha pegada al borde */
  const flowerPositions = [
    { side: "left" as const, top: "3%", offset: "-2rem" },
    { side: "right" as const, top: "8%", offset: "0" },
    { side: "left" as const, top: "15%", offset: "-1.5rem" },
    { side: "right" as const, top: "20%", offset: "0.2rem" },
    { side: "left" as const, top: "25%", offset: "-2.5rem" },
    { side: "right" as const, top: "32%", offset: "0" },
    { side: "left" as const, top: "40%", offset: "-1.5rem" },
    { side: "right" as const, top: "45%", offset: "0.5rem" },
    { side: "left" as const, top: "55%", offset: "-2rem" },
    { side: "right" as const, top: "60%", offset: "0" },
    { side: "left" as const, top: "70%", offset: "-2.5rem" },
    { side: "right" as const, top: "75%", offset: "0.2rem" },
    { side: "left" as const, top: "82%", offset: "-1rem" },
    { side: "right" as const, top: "88%", offset: "0.5rem" },
    { side: "left" as const, top: "95%", offset: "-2rem" },
    { side: "right" as const, top: "98%", offset: "0" },
  ];
  const flowerSizes = ["w-13 h-13 md:w-16 md:h-16", "w-10 h-10 md:w-13 md:h-13", "w-16 h-16 md:w-18 md:h-18", "w-12 h-12 md:w-14 md:h-14", "w-9 h-9 md:w-12 md:h-12"];
  flowerPositions.forEach((pos, i) => {
    items.push({
      type: "flower",
      size: flowerSizes[i % flowerSizes.length],
      ...(pos.side === "left" ? { left: pos.offset } : { right: pos.offset }),
      top: pos.top,
      zIndex: 3,
      orderKey: orderKey++,
      florVariant: i % 5,
    });
  });

  return items.sort((a, b) => {
    const getY = (o: OrnamentDef) => {
      if (o.top) return parseFloat(o.top);
      if (o.bottom) return 100 - parseFloat(o.bottom);
      return 0;
    };
    return getY(a) - getY(b);
  });
}

export default function FloralSideOrnaments() {
  const shouldReduceMotion = useReducedMotion();
  const ornaments = useMemo(() => generateOrnaments(), []);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(wrapperRef, { once: false, amount: 0.02 });
  const scrollDirection = useScrollDirection();
  const fromY = scrollDirection === "down" ? LATERAL.fromY : -LATERAL.fromY;

  return (
    <div ref={wrapperRef} className="floral-arbor-wrapper floral-arbor-wrapper--extended" aria-hidden>
      {ornaments.map((item, i) => {
        const isRightSide = item.right !== undefined && item.left === undefined;
        const needsMirror = item.mirror && item.type !== "branch" && item.type !== "branchCorner";
        const isFlower = item.type === "flower";
        const staggerDelay = Math.min(i * LATERAL.staggerBase, LATERAL.staggerMax);

        const hiddenState = shouldReduceMotion
          ? { opacity: 0 }
          : { opacity: 0, y: fromY, scale: isFlower ? LATERAL.scaleFlower : LATERAL.scaleBranch, rotate: isFlower ? LATERAL.rotateFlower : 0 };
        const visibleState = { opacity: 1, y: 0, scale: 1, rotate: 0 };

        return (
          <motion.div
            key={`${item.type}-${item.orderKey}-${i}`}
            className={`floral-ornament floral-ornament--${item.type} ${isRightSide ? "floral-ornament--right" : ""} ${item.size}`}
            style={{
              left: item.left,
              right: item.right,
              top: item.top,
              bottom: item.bottom,
              zIndex: item.zIndex,
            }}
            initial={hiddenState}
            animate={isInView ? visibleState : hiddenState}
            transition={{
              duration: shouldReduceMotion ? 0.3 : isFlower ? LATERAL.durationFlower : LATERAL.durationBranch + (i % 3) * 0.05,
              delay: isInView ? (shouldReduceMotion ? 0 : staggerDelay) : 0,
              ease: LATERAL.ease,
            }}
          >
            <div className={`w-full h-full ${needsMirror ? "floral-ornament-mirror" : ""}`}>
              {isFlower ? (
                <FlorImage variant={item.florVariant ?? 0} />
              ) : (
                <RamaImage
                  variant={item.ramaVariant ?? 2}
                  alignBottom={item.type === "branchCorner" && item.bottom !== undefined}
                />
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
