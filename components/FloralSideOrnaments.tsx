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

  /* Intercalado: ramas y flores en posiciones alternas para reducir ruido visual */
  const BRANCH_SIZE = "w-14 md:w-20 h-[100px] md:h-[130px]";
  const OFFSET = "-1.5rem";

  /* Posiciones intercaladas: rama-flor-rama-flor... */
  const BRANCH_PCTS = [0, 14, 28, 42, 56, 70, 84, 98];
  const FLOWER_PCTS = [7, 21, 35, 49, 63, 77, 91]; /* entre ramas */

  /* Izquierda: ramas */
  BRANCH_PCTS.forEach((topPct, i) => {
    const variant: 2 | 3 = i % 2 === 0 ? 2 : 3;
    items.push({
      type: "branch",
      size: BRANCH_SIZE,
      left: OFFSET,
      top: `${topPct}%`,
      zIndex: 1,
      mirror: false,
      orderKey: orderKey++,
      ramaVariant: variant,
    });
  });

  /* Derecha: ramas */
  BRANCH_PCTS.forEach((topPct, i) => {
    const variant: 2 | 3 = i % 2 === 0 ? 3 : 2;
    items.push({
      type: "branch",
      size: BRANCH_SIZE,
      right: OFFSET,
      top: `${topPct}%`,
      zIndex: 1,
      mirror: true,
      orderKey: orderKey++,
      ramaVariant: variant,
    });
  });

  /* Esquinas — discretas */
  items.push({ type: "branchCorner", size: "w-12 h-12 md:w-16 md:h-16", left: "-1rem", top: "0", zIndex: 2, orderKey: orderKey++, ramaVariant: 2 });
  items.push({ type: "branchCorner", size: "w-12 h-12 md:w-16 md:h-16", right: "-1rem", top: "0", zIndex: 2, orderKey: orderKey++, ramaVariant: 3 });
  items.push({ type: "branchCorner", size: "w-12 h-12 md:w-16 md:h-16", left: "-1rem", bottom: "0", zIndex: 2, orderKey: orderKey++, ramaVariant: 2 });
  items.push({ type: "branchCorner", size: "w-12 h-12 md:w-16 md:h-16", right: "-1rem", bottom: "0", zIndex: 2, orderKey: orderKey++, ramaVariant: 3 });

  /* Flores intercaladas entre ramas — alternando lados */
  const flowerPositions = [
    { side: "left" as const, top: "7%", offset: "-0.75rem" },
    { side: "right" as const, top: "21%", offset: "0" },
    { side: "left" as const, top: "35%", offset: "-0.75rem" },
    { side: "right" as const, top: "49%", offset: "0" },
    { side: "left" as const, top: "63%", offset: "-0.75rem" },
    { side: "right" as const, top: "77%", offset: "0" },
    { side: "left" as const, top: "91%", offset: "-0.75rem" },
  ];
  const flowerSizes = ["w-5 h-5 md:w-6 md:h-6", "w-4 h-4 md:w-5 md:h-5", "w-6 h-6 md:w-7 md:h-7"];
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
