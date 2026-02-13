"use client";

import { useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";

/* ───────────────────────────────────────────
   Arbusto floral — muchos motivos alrededor
   de las tarjetas, ramas, flores apiladas
   x10 densidad, carga de arriba a abajo,
   flores creciendo al aparecer (rotate + scale)
   ─────────────────────────────────────────── */

function PetalFlower() {
  return (
    <svg viewBox="0 0 80 80" fill="none" className="w-full h-full" aria-hidden>
      <g fill="rgb(var(--primary))" fillOpacity="0.12">
        <ellipse cx="40" cy="20" rx="8" ry="16" transform="rotate(0 40 40)" />
        <ellipse cx="40" cy="20" rx="8" ry="16" transform="rotate(72 40 40)" />
        <ellipse cx="40" cy="20" rx="8" ry="16" transform="rotate(144 40 40)" />
        <ellipse cx="40" cy="20" rx="8" ry="16" transform="rotate(216 40 40)" />
        <ellipse cx="40" cy="20" rx="8" ry="16" transform="rotate(288 40 40)" />
        <circle cx="40" cy="40" r="6" fillOpacity="0.18" />
      </g>
    </svg>
  );
}

function LeafCluster() {
  return (
    <svg viewBox="0 0 60 60" fill="none" className="w-full h-full" aria-hidden>
      <g fill="rgb(var(--primary))" fillOpacity="0.1">
        <path d="M30 5 Q45 25 30 55 Q15 25 30 5" />
        <path d="M30 10 Q50 30 25 50 Q10 30 30 10" transform="rotate(-40 30 30)" />
        <path d="M30 10 Q10 30 35 50 Q50 30 30 10" transform="rotate(40 30 30)" />
      </g>
    </svg>
  );
}

function OrganicBloom() {
  return (
    <svg viewBox="0 0 100 100" fill="none" className="w-full h-full" aria-hidden>
      <g stroke="rgb(var(--primary))" strokeWidth="1" strokeOpacity="0.2" fill="none">
        <circle cx="50" cy="50" r="8" />
        <path d="M50 42 Q55 50 50 58 Q45 50 50 42" />
        <path d="M42 50 Q50 45 58 50 Q50 55 42 50" />
        <circle cx="50" cy="50" r="20" opacity="0.4" />
        <circle cx="50" cy="50" r="32" opacity="0.2" />
      </g>
    </svg>
  );
}

function SmallBud() {
  return (
    <svg viewBox="0 0 40 40" fill="none" className="w-full h-full" aria-hidden>
      <g fill="rgb(var(--primary))" fillOpacity="0.15">
        <ellipse cx="20" cy="20" rx="6" ry="10" />
        <ellipse cx="20" cy="20" rx="6" ry="10" transform="rotate(60 20 20)" />
        <ellipse cx="20" cy="20" rx="6" ry="10" transform="rotate(120 20 20)" />
      </g>
    </svg>
  );
}

/* Ramas — curvas orgánicas */
function BranchLeft() {
  return (
    <svg viewBox="0 0 120 200" fill="none" className="w-full h-full floral-branch" aria-hidden>
      <path
        d="M100 0 Q60 40 80 80 Q100 120 70 160 Q50 190 30 200"
        stroke="rgb(var(--primary))"
        strokeWidth="1.5"
        strokeOpacity="0.15"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M90 30 Q70 50 75 90"
        stroke="rgb(var(--primary))"
        strokeWidth="1"
        strokeOpacity="0.12"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M95 70 Q75 95 80 130"
        stroke="rgb(var(--primary))"
        strokeWidth="1"
        strokeOpacity="0.1"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}

function BranchRight() {
  return (
    <svg viewBox="0 0 120 200" fill="none" className="w-full h-full floral-branch floral-branch--right" aria-hidden>
      <path
        d="M20 0 Q60 40 40 80 Q20 120 50 160 Q70 190 90 200"
        stroke="rgb(var(--primary))"
        strokeWidth="1.5"
        strokeOpacity="0.15"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M30 30 Q50 50 45 90"
        stroke="rgb(var(--primary))"
        strokeWidth="1"
        strokeOpacity="0.12"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M25 70 Q45 95 40 130"
        stroke="rgb(var(--primary))"
        strokeWidth="1"
        strokeOpacity="0.1"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}

function BranchCornerTL() {
  return (
    <svg viewBox="0 0 150 150" fill="none" className="w-full h-full floral-branch" aria-hidden>
      <path
        d="M0 80 Q40 60 80 80 Q120 100 150 120"
        stroke="rgb(var(--primary))"
        strokeWidth="1.2"
        strokeOpacity="0.12"
        fill="none"
        strokeLinecap="round"
      />
      <path d="M40 50 Q70 70 90 60" stroke="rgb(var(--primary))" strokeWidth="0.8" strokeOpacity="0.1" fill="none" strokeLinecap="round" />
    </svg>
  );
}

function BranchCornerBR() {
  return (
    <svg viewBox="0 0 150 150" fill="none" className="w-full h-full floral-branch floral-branch--right" aria-hidden>
      <path
        d="M150 70 Q110 90 70 70 Q30 50 0 30"
        stroke="rgb(var(--primary))"
        strokeWidth="1.2"
        strokeOpacity="0.12"
        fill="none"
        strokeLinecap="round"
      />
      <path d="M110 100 Q80 80 60 90" stroke="rgb(var(--primary))" strokeWidth="0.8" strokeOpacity="0.1" fill="none" strokeLinecap="round" />
    </svg>
  );
}

type OrnamentType = "flower" | "leaf" | "bloom" | "bud" | "branch" | "branchCorner";

interface OrnamentDef {
  type: OrnamentType;
  size: string;
  left?: string;
  right?: string;
  top?: string;
  bottom?: string;
  zIndex: number;
  mirror?: boolean;
  orderKey: number; /* para ordenar arriba→abajo y calcular delay dinámico */
}

const FLOWER_TYPES: OrnamentType[] = ["flower", "leaf", "bloom", "bud"];
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

  /* Ramas base (arriba de todo) */
  items.push({
    type: "branch",
    size: "w-14 h-full min-h-[220px]",
    left: "0",
    top: "0",
    zIndex: 0,
    mirror: false,
    orderKey: orderKey++,
  });
  items.push({
    type: "branch",
    size: "w-14 h-full min-h-[220px]",
    right: "0",
    top: "0",
    zIndex: 0,
    mirror: true,
    orderKey: orderKey++,
  });
  items.push({
    type: "branchCorner",
    size: "w-24 h-24 md:w-32 md:h-32",
    left: "0",
    top: "0",
    zIndex: 0,
    orderKey: orderKey++,
  });
  items.push({
    type: "branchCorner",
    size: "w-20 h-20 md:w-28 md:h-28",
    right: "0",
    bottom: "0",
    zIndex: 0,
    orderKey: orderKey++,
  });

  /* Columna izquierda — x10 filas de flores/hojas (empiezan más arriba: -8% a 105%) */
  for (let row = 0; row < 40; row++) {
    const topPct = -8 + (row / 39) * 113; /* -8% hasta 105% */
    const count = row % 3 === 0 ? 3 : 2; /* cada 3 filas una extra */
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
      });
    }
  }

  /* Columna derecha — x10 filas */
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
      });
    }
  }

  /* Centro-top y centro-bottom — más densidad */
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
      });
    } else {
      items.push({
        type,
        size,
        ...(side === "left" ? { left: `${pct}%` } : { right: `${pct}%` }),
        bottom: `${(i % 5)}%`,
        zIndex: i % 3,
        orderKey: orderKey++,
      });
    }
  }

  /* Esquinas extra */
  for (let i = 0; i < 20; i++) {
    const corner = i % 4;
    const type = FLOWER_TYPES[i % FLOWER_TYPES.length];
    const size = SIZES[(i % 3) + 1];
    if (corner === 0) {
      items.push({ type, size, left: `${(i % 3) * 0.8}rem`, top: `${-4 + i}%`, zIndex: 2, orderKey: orderKey++ });
    } else if (corner === 1) {
      items.push({ type, size, right: `${(i % 3) * 0.8}rem`, top: `${-4 + i}%`, zIndex: 2, orderKey: orderKey++ });
    } else if (corner === 2) {
      items.push({ type, size, left: `${(i % 3) * 0.8}rem`, bottom: `${i % 4}%`, zIndex: 2, orderKey: orderKey++ });
    } else {
      items.push({ type, size, right: `${(i % 3) * 0.8}rem`, bottom: `${i % 4}%`, zIndex: 2, orderKey: orderKey++ });
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

const COMPONENT_MAP = {
  flower: PetalFlower,
  leaf: LeafCluster,
  bloom: OrganicBloom,
  bud: SmallBud,
  branch: BranchLeft,
  branchCorner: BranchCornerTL,
};

const STAGGER_BASE = 0.012; /* delay por orden (arriba→abajo) */
const STAGGER_MAX = 1.8; /* delay máximo total */

export default function FloralSideOrnaments() {
  const shouldReduceMotion = useReducedMotion();
  const ornaments = useMemo(() => generateOrnaments(), []);

  return (
    <div className="floral-arbor-wrapper floral-arbor-wrapper--extended" aria-hidden>
      {ornaments.map((item, i) => {
        let Rendered: () => JSX.Element;
        if (item.type === "branch") {
          Rendered = item.mirror ? BranchRight : BranchLeft;
        } else if (item.type === "branchCorner") {
          Rendered = item.right !== undefined && item.bottom !== undefined ? BranchCornerBR : BranchCornerTL;
        } else {
          Rendered = COMPONENT_MAP[item.type];
        }

        const needsMirror = item.mirror && item.type !== "branch" && item.type !== "branchCorner";
        const isRightSide = item.right !== undefined && item.left === undefined;
        const isFlower = FLOWER_TYPES.includes(item.type);

        /* Delay dinámico: arriba (i bajo) → poco delay; abajo → más delay */
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
              <Rendered />
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
