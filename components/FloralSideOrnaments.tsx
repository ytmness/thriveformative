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

function shuffle<T>(arr: T[], seed: number): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const r = Math.sin(seed * (i + 1)) * 0.5 + 0.5;
    const j = Math.min(i, Math.floor(r * (i + 1)));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function generateOrnaments(): OrnamentDef[] {
  const items: OrnamentDef[] = [];
  let orderKey = 0;
  const seed = 0.39472; /* semilla para aleatoriedad consistente */

  /* Imágenes más grandes */
  const BRANCH_SIZE = "w-18 md:w-26 h-[120px] md:h-[165px]";
  const OFFSET = "-1.5rem";

  /* Posiciones base distribuidas, luego barajadas para orden aleatorio */
  const basePcts = [2, 12, 22, 35, 48, 58, 70, 82, 95];
  const branchPctsLeft = shuffle(basePcts.slice(0, 8), seed);
  const branchPctsRight = shuffle(basePcts.slice(0, 8), seed + 0.1);

  /* Izquierda: ramas en orden aleatorio */
  branchPctsLeft.forEach((topPct, i) => {
    items.push({
      type: "branch",
      size: BRANCH_SIZE,
      left: OFFSET,
      top: `${topPct}%`,
      zIndex: 1,
      mirror: false,
      orderKey: orderKey++,
      ramaVariant: (i % 2 === 0 ? 2 : 3) as 2 | 3,
    });
  });

  /* Derecha: ramas en orden aleatorio */
  branchPctsRight.forEach((topPct, i) => {
    items.push({
      type: "branch",
      size: BRANCH_SIZE,
      right: OFFSET,
      top: `${topPct}%`,
      zIndex: 1,
      mirror: true,
      orderKey: orderKey++,
      ramaVariant: (i % 2 === 0 ? 3 : 2) as 2 | 3,
    });
  });

  /* Esquinas — más grandes */
  items.push({ type: "branchCorner", size: "w-14 h-14 md:w-20 md:h-20", left: "-1rem", top: "0", zIndex: 2, orderKey: orderKey++, ramaVariant: 2 });
  items.push({ type: "branchCorner", size: "w-14 h-14 md:w-20 md:h-20", right: "-1rem", top: "0", zIndex: 2, orderKey: orderKey++, ramaVariant: 3 });
  items.push({ type: "branchCorner", size: "w-14 h-14 md:w-20 md:h-20", left: "-1rem", bottom: "0", zIndex: 2, orderKey: orderKey++, ramaVariant: 2 });
  items.push({ type: "branchCorner", size: "w-14 h-14 md:w-20 md:h-20", right: "-1rem", bottom: "0", zIndex: 2, orderKey: orderKey++, ramaVariant: 3 });

  /* Flores: posiciones y lados aleatorios, tamaños variados y más grandes */
  const flowerTops = shuffle([8, 19, 33, 44, 52, 65, 78, 88], seed + 0.2);
  const flowerSides = shuffle(
    Array.from({ length: 8 }, (_, i) => (i % 2 === 0 ? "left" : "right")),
    seed + 0.3
  );
  const flowerSizes = ["w-6 h-6 md:w-8 md:h-8", "w-5 h-5 md:w-7 md:h-7", "w-7 h-7 md:w-9 md:h-9", "w-6 h-6 md:w-8 md:h-8"];
  const leftOffsets = ["-0.75rem", "-1rem", "-0.5rem", "-1rem"];
  const rightOffsets = ["0", "0.1rem", "0.15rem", "0"];

  flowerTops.forEach((topPct, i) => {
    const side = flowerSides[i] as "left" | "right";
    const offset = side === "left" ? leftOffsets[i % leftOffsets.length] : rightOffsets[i % rightOffsets.length];
    items.push({
      type: "flower",
      size: flowerSizes[i % flowerSizes.length],
      ...(side === "left" ? { left: offset } : { right: offset }),
      top: `${topPct}%`,
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
