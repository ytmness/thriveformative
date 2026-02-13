"use client";

import { motion, useReducedMotion, Variants } from "framer-motion";
import FloralSideOrnaments from "./FloralSideOrnaments";
import { useScrollDirection } from "@/lib/useScrollDirection";
import { LATERAL } from "@/lib/lateralAnimation";

type CardVariant =
  | "slideUp"
  | "slideLeft"
  | "slideRight"
  | "scale"
  | "curtain"
  | "blur"
  | "stack";

interface GiantScrollCardProps {
  children: React.ReactNode;
  variant?: CardVariant;
  className?: string;
  id?: string;
}

function buildVariants(fromY: number): Record<CardVariant, Variants> {
  return {
    slideUp: {
      hidden: { opacity: 0, y: fromY },
      visible: { opacity: 1, y: 0 },
    },
    slideLeft: {
      hidden: { opacity: 0, x: fromY },
      visible: { opacity: 1, x: 0 },
    },
    slideRight: {
      hidden: { opacity: 0, x: -fromY },
      visible: { opacity: 1, x: 0 },
    },
    scale: {
      hidden: { opacity: 0, scale: LATERAL.scaleBranch },
      visible: { opacity: 1, scale: 1 },
    },
    curtain: {
      hidden: { opacity: 0, y: 0, filter: "brightness(0.7)" },
      visible: { opacity: 1, y: 0, filter: "brightness(1)" },
    },
    blur: {
      hidden: { opacity: 0, filter: "blur(14px)" },
      visible: { opacity: 1, filter: "blur(0px)" },
    },
    stack: {
      hidden: { opacity: 0, y: fromY, scale: LATERAL.scaleBranch },
      visible: { opacity: 1, y: 0, scale: 1 },
    },
  };
}

export default function GiantScrollCard({
  children,
  variant = "slideUp",
  className = "",
  id,
}: GiantScrollCardProps) {
  const shouldReduceMotion = useReducedMotion();
  const scrollDirection = useScrollDirection();
  const fromY = scrollDirection === "down" ? LATERAL.fromY : -LATERAL.fromY;
  const variants = buildVariants(fromY);
  const v = variants[variant];

  const reducedVariants: Variants = {
    hidden: { opacity: 0.7 },
    visible: { opacity: 1 },
  };

  const effectiveVariants: Variants = shouldReduceMotion ? reducedVariants : v;

  return (
    <motion.article
      id={id}
      className={`giant-card ${className}`}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: false, amount: 0.15, margin: "-50px" }}
      transition={{
        duration: LATERAL.durationFlower,
        ease: LATERAL.ease,
      }}
      variants={effectiveVariants}
    >
      <div className="giant-card-inner">
        <FloralSideOrnaments />
        {children}
      </div>
    </motion.article>
  );
}
