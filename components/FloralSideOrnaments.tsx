"use client";

import { useMemo } from "react";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";

/* ───────────────────────────────────────────
   Arbusto floral — imágenes de 5x/
   flor 1-5, rama 1-5. Carga de arriba a abajo,
   flores creciendo al aparecer.
   ─────────────────────────────────────────── */

const FLOR_IMAGES = ["/floral/flor-1.png", "/floral/flor-2.png", "/floral/flor-3.png", "/floral/flor-4.png", "/floral/flor-5.png"];
const RAMA_IMAGES = ["/floral/rama-1.png", "/floral/rama-2.png", "/floral/rama-3.png", "/floral/rama-4.png", "/floral/rama-5.png"];

function FlorImage({ variant }: { variant: number }) {
  const src = FLOR_IMAGES[variant % FLOR_IMAGES.length];
  return (
    <div className="relative w-full h-full">
      <Image src={src} alt="" fill className="object-contain" sizes="(max-width: 768px) 64px, 96px" />
    </div>
  );
}

function RamaImage({ variant, alignBottom = false }: { variant: number; alignBottom?: boolean }) {
  const src = RAMA_IMAGES[variant % RAMA_IMAGES.length];
  return (
    <div className="relative w-full h-full">
      <Image
        src={src}
        alt=""
        fill
        className={`object-contain ${alignBottom ? "object-bottom" : "object-top"}`}
        sizes="(max-width: 768px) 56px, 120px"
      />
    </div>
  );
}

type OrnamentType = "flower" | "leaf" | "bloom" | "bud" | "flor5" | "branch" | "branchCorner";

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
  florVariant?: number; /* 0-4 para flor 1-5 */
  ramaVariant?: number; /* 0-4 para rama 1-5 */
}

const FLOWER_TYPES: OrnamentType[] = ["flower", "leaf", "bloom", "bud", "flor5"];
const SIZES = [
  "w-6 h-6 md:w-7 md:h-7",
  "w-7 h-7 md:w-8 md:h-8",
  "w-8 h-8 md:w-9 md:h-9",
  "w-9 h-9 md:w-10 md:h-10",
  "w-10 h-10 md:w-12 md:h-12",
  "w-11 h-11 md:w-13 md:h-13",
  "w-12 h-12 md:w-14 md:h-14",
  "w-14 h-14 md:w-16 md:h-16",
];

/* Genera ornamentos x10 — dinámicos, posicionados más arriba */
function generateOrnaments(): OrnamentDef[] {
  const items: OrnamentDef[] = [];
  let orderKey = 0;

  /* Ramas base — rama 1, 2, 3, 4 */
  items.push({
    type: "branch",
    size: "w-14 h-full min-h-[220px]",
    left: "0",
    top: "0",
    zIndex: 0,
    mirror: false,
    orderKey: orderKey++,
    ramaVariant: 0,
  });
  items.push({
    type: "branch",
    size: "w-14 h-full min-h-[220px]",
    right: "0",
    top: "0",
    zIndex: 0,
    mirror: true,
    orderKey: orderKey++,
    ramaVariant: 1,
  });
  items.push({
    type: "branchCorner",
    size: "w-24 h-24 md:w-32 md:h-32",
    left: "0",
    top: "0",
    zIndex: 0,
    orderKey: orderKey++,
    ramaVariant: 2,
  });
  items.push({
    type: "branchCorner",
    size: "w-20 h-20 md:w-28 md:h-28",
    right: "0",
    bottom: "0",
    zIndex: 0,
    orderKey: orderKey++,
    ramaVariant: 4, /* rama 5 */
  });

  /* Columna izquierda — flores 1-5 */
  for (let row = 0; row < 40; row++) {
    const topPct = -8 + (row / 39) * 113;
    const count = row % 3 === 0 ? 3 : 2;
    for (let c = 0; c < count; c++) {
      const type = FLOWER_TYPES[(row + c) % FLOWER_TYPES.length];
      const size = SIZES[(row + c) % SIZES.length];
      const leftOff = `${(c * 0.4 + 0.1).toFixed(1)}rem`;
      items.push({
        type,
        size,
        left: leftOff,
        top: `${topPct.toFixed(1)}%`,
        zIndex: (row + c) % 4,
        orderKey: orderKey++,
        florVariant: (row + c) % 5,
      });
    }
  }

  /* Columna derecha */
  for (let row = 0; row < 40; row++) {
    const topPct = -8 + (row / 39) * 113;
    const count = row % 3 === 0 ? 3 : 2;
    for (let c = 0; c < count; c++) {
      const type = FLOWER_TYPES[(row + c + 2) % FLOWER_TYPES.length];
      const size = SIZES[(row + c + 1) % SIZES.length];
      const rightOff = `${(c * 0.35 + 0.15).toFixed(1)}rem`;
      items.push({
        type,
        size,
        right: rightOff,
        top: `${topPct.toFixed(1)}%`,
        zIndex: (row + c) % 4,
        orderKey: orderKey++,
        florVariant: (row + c + 1) % 5,
      });
    }
  }

  /* Centro-top y centro-bottom */
  for (let i = 0; i < 30; i++) {
    const side = i % 2 === 0 ? "left" : "right";
    const pct = 5 + (i % 18) * 5;
    const type = FLOWER_TYPES[i % FLOWER_TYPES.length];
    const size = SIZES[i % SIZES.length];
    if (i < 15) {
      items.push({
        type,
        size,
        ...(side === "left" ? { left: `${pct}%` } : { right: `${pct}%` }),
        top: `${-2 + (i % 5)}%`,
        zIndex: i % 3,
        orderKey: orderKey++,
        florVariant: i % 5,
      });
    } else {
      items.push({
        type,
        size,
        ...(side === "left" ? { left: `${pct}%` } : { right: `${pct}%` }),
        bottom: `${(i % 5)}%`,
        zIndex: i % 3,
        orderKey: orderKey++,
        florVariant: (i + 2) % 5,
      });
    }
  }

  /* Esquinas extra */
  for (let i = 0; i < 20; i++) {
    const corner = i % 4;
    const type = FLOWER_TYPES[i % FLOWER_TYPES.length];
    const size = SIZES[(i % 3) + 1];
    const base = { type, size, zIndex: 2, orderKey: orderKey++, florVariant: i % 5 };
    if (corner === 0) {
      items.push({ ...base, left: `${(i % 3) * 0.8}rem`, top: `${-4 + i}%` });
    } else if (corner === 1) {
      items.push({ ...base, right: `${(i % 3) * 0.8}rem`, top: `${-4 + i}%` });
    } else if (corner === 2) {
      items.push({ ...base, left: `${(i % 3) * 0.8}rem`, bottom: `${i % 4}%` });
    } else {
      items.push({ ...base, right: `${(i % 3) * 0.8}rem`, bottom: `${i % 4}%` });
    }
  }

  /* Ordenar por posición Y (arriba → abajo) para animación de carga */
  return items.sort((a, b) => {
    const getY = (o: OrnamentDef) => {
      if (o.top) return parseFloat(o.top);
      if (o.bottom) return 100 - parseFloat(o.bottom);
      return 0;
    };
    return getY(a) - getY(b);
  });
}

/* Flores usan FlorImage con florVariant 0-4; ramas usan RamaImage con ramaVariant 0-4 */

const STAGGER_BASE = 0.012; /* delay por orden (arriba→abajo) */
const STAGGER_MAX = 1.8; /* delay máximo total */

export default function FloralSideOrnaments() {
  const shouldReduceMotion = useReducedMotion();
  const ornaments = useMemo(() => generateOrnaments(), []);

  return (
    <div className="floral-arbor-wrapper floral-arbor-wrapper--extended" aria-hidden>
      {ornaments.map((item, i) => {
        const isRightSide = item.right !== undefined && item.left === undefined;
        const isFlower = FLOWER_TYPES.includes(item.type);
        const needsMirror = item.mirror && item.type !== "branch" && item.type !== "branchCorner";

        const staggerDelay = Math.min(i * STAGGER_BASE, STAGGER_MAX);

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
            initial={{
              opacity: 0,
              scale: shouldReduceMotion ? 1 : 0,
              rotate: shouldReduceMotion ? 0 : isFlower ? 360 : 0,
            }}
            whileInView={{
              opacity: 1,
              scale: 1,
              rotate: 0,
            }}
            viewport={{ once: true, amount: 0.02 }}
            transition={{
              duration: shouldReduceMotion ? 0.3 : 0.5 + (i % 4) * 0.08,
              delay: shouldReduceMotion ? 0 : staggerDelay,
              ease: [0.22, 0.61, 0.36, 1],
            }}
          >
            <div className={needsMirror ? "floral-ornament-mirror" : ""}>
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
      })}
    </div>
  );
}
