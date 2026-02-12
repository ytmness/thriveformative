"use client";

import { motion, useReducedMotion, Variants } from "framer-motion";

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

const variants: Record<CardVariant, Variants> = {
  slideUp: {
    hidden: { opacity: 0, y: 80 },
    visible: { opacity: 1, y: 0 },
  },
  slideLeft: {
    hidden: { opacity: 0, x: 60 },
    visible: { opacity: 1, x: 0 },
  },
  slideRight: {
    hidden: { opacity: 0, x: -60 },
    visible: { opacity: 1, x: 0 },
  },
  scale: {
    hidden: { opacity: 0, scale: 0.94 },
    visible: { opacity: 1, scale: 1 },
  },
  curtain: {
    hidden: { opacity: 0, y: 0, filter: "brightness(0.7)" },
    visible: { opacity: 1, y: 0, filter: "brightness(1)" },
  },
  blur: {
    hidden: { opacity: 0, filter: "blur(12px)" },
    visible: { opacity: 1, filter: "blur(0px)" },
  },
  stack: {
    hidden: { opacity: 0, y: 50, scale: 0.98 },
    visible: { opacity: 1, y: 0, scale: 1 },
  },
};

export default function GiantScrollCard({
  children,
  variant = "slideUp",
  className = "",
  id,
}: GiantScrollCardProps) {
  const shouldReduceMotion = useReducedMotion();
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
      viewport={{ once: false, amount: 0.12, margin: "-80px" }}
      transition={{
        duration: 0.7,
        ease: [0.25, 0.1, 0.25, 1],
      }}
      variants={effectiveVariants}
    >
      <div className="giant-card-inner">{children}</div>
    </motion.article>
  );
}
