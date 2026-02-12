"use client";

import { motion, useReducedMotion } from "framer-motion";

/* ───────────────────────────────────────────
   Motivos florales/organicos SVG
   Mismo tono que las olas (primary)
   Animación "florecer" al entrar en viewport
   ─────────────────────────────────────────── */

function PetalFlower() {
  return (
    <svg viewBox="0 0 80 80" fill="none" className="w-full h-full" aria-hidden>
      <g fill="rgb(var(--primary))" fillOpacity="0.12">
        {/* Pétalos suaves estilo orgánico */}
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
        <path d="M48 48 Q52 48 52 52 Q48 52 48 48" transform="rotate(45 50 50)" />
        <circle cx="50" cy="50" r="20" opacity="0.4" />
        <circle cx="50" cy="50" r="32" opacity="0.2" />
      </g>
    </svg>
  );
}

const ornaments = [
  { Component: PetalFlower, size: "w-16 h-16 md:w-20 md:h-20", top: "15%", delay: 0 },
  { Component: LeafCluster, size: "w-12 h-12 md:w-16 md:h-16", top: "40%", delay: 0.15 },
  { Component: OrganicBloom, size: "w-14 h-14 md:w-18 md:h-18", top: "70%", delay: 0.3 },
  { Component: PetalFlower, size: "w-10 h-10 md:w-12 md:h-12", top: "85%", delay: 0.45 },
];

interface SideProps {
  side: "left" | "right";
}

function SideOrnaments({ side }: SideProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div
      className={`floral-side-ornaments floral-side-ornaments--${side}`}
      aria-hidden
    >
      {ornaments.map(({ Component, size, top, delay }, i) => (
        <motion.div
          key={`${side}-${i}`}
          className={`floral-ornament ${size}`}
          style={{ top }}
          initial={{
            opacity: 0,
            scale: shouldReduceMotion ? 1 : 0.3,
            rotate: side === "left" ? -12 : 12,
          }}
          whileInView={{
            opacity: 1,
            scale: 1,
            rotate: 0,
          }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{
            duration: 0.7,
            delay: shouldReduceMotion ? 0 : delay,
            ease: [0.22, 0.61, 0.36, 1],
          }}
        >
          <div className={side === "right" ? "floral-ornament-mirror" : ""}>
            <Component />
          </div>
        </motion.div>
      ))}
    </div>
  );
}

export default function FloralSideOrnaments() {
  return (
    <>
      <SideOrnaments side="left" />
      <SideOrnaments side="right" />
    </>
  );
}
