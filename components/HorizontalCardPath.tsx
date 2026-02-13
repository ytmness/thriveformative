"use client";

import { useMemo, useRef } from "react";
import { motion, useScroll, useTransform, useReducedMotion, type MotionValue } from "framer-motion";
import { useScrollDirection } from "@/lib/useScrollDirection";
import { LATERAL } from "@/lib/lateralAnimation";

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

function PathFlower({
  pos,
  i,
  side,
  fromY,
  scrollProgress,
}: {
  pos: { x: string; top: string };
  i: number;
  side: "left" | "right";
  fromY: number;
  scrollProgress: MotionValue<number>;
}) {
  const staggerStart = 0.05 + i * 0.015;
  const staggerEnd = Math.min(staggerStart + 0.25, 0.95);
  const localProgress = useTransform(scrollProgress, [staggerStart, staggerEnd], [0, 1]);
  const flowerOpacity = useTransform(localProgress, [0, 1], [0, 1]);
  const flowerY = useTransform(localProgress, [0, 1], [fromY, 0]);
  const flowerScale = useTransform(localProgress, [0, 1], [LATERAL.scaleFlower, 1]);
  const flowerRotate = useTransform(localProgress, [0, 1], [side === "left" ? LATERAL.rotateFlower : -LATERAL.rotateFlower, 0]);
  return (
    <motion.div
      className={`horizontal-card-path__flower${side === "right" ? " horizontal-card-path__flower--right" : ""} ${FLOWER_SIZES[i % FLOWER_SIZES.length]}`}
      style={{
        [side === "left" ? "left" : "right"]: pos.x,
        top: pos.top,
        zIndex: 3,
        opacity: flowerOpacity,
        y: flowerY,
        scale: flowerScale,
        rotate: flowerRotate,
      }}
    >
      <FlorImage variant={i % 5} />
    </motion.div>
  );
}

function PathSide({
  side,
  flowers,
  fromY,
  scrollProgress,
}: {
  side: "left" | "right";
  flowers: { side: "left" | "right"; x: string; top: string }[];
  fromY: number;
  scrollProgress: MotionValue<number>;
}) {
  const branchOpacity = useTransform(scrollProgress, [0, 0.3], [0, 1]);
  const branchY = useTransform(scrollProgress, [0, 0.3], [fromY, 0]);
  const branchScale = useTransform(scrollProgress, [0, 0.3], [LATERAL.scaleBranch, 1]);

  return (
    <motion.div
      className={`horizontal-card-path__side horizontal-card-path__side--${side}`}
      style={{ opacity: branchOpacity, y: branchY, scale: branchScale }}
    >
      <div className={`horizontal-card-path__branches${side === "right" ? " horizontal-card-path__branches--right" : ""}`} />
      {flowers.map((pos, i) => (
        <PathFlower key={`${side}-f-${i}`} pos={pos} i={i} side={side} fromY={fromY} scrollProgress={scrollProgress} />
      ))}
    </motion.div>
  );
}

export default function HorizontalCardPath() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const scrollDirection = useScrollDirection();
  const fromY = scrollDirection === "down" ? LATERAL.fromY : -LATERAL.fromY;

  const { scrollYProgress } = useScroll({
    target: wrapperRef,
    offset: ["start 1", "start 0.15"],
  });

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
      <PathSide side="left" flowers={leftFlowers} fromY={fromY} scrollProgress={scrollYProgress} />
      <PathSide side="right" flowers={rightFlowers} fromY={fromY} scrollProgress={scrollYProgress} />
    </div>
  );
}
