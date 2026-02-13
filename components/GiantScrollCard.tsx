"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
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

export default function GiantScrollCard({
  children,
  variant = "slideUp",
  className = "",
  id,
}: GiantScrollCardProps) {
  const ref = useRef<HTMLElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const scrollDirection = useScrollDirection();
  const fromY = scrollDirection === "down" ? LATERAL.fromY : -LATERAL.fromY;

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 1", "start 0.15"],
  });

  const opacity = useTransform(scrollYProgress, [0, 0.4, 1], [0, 0.3, 1]);
  const y = useTransform(scrollYProgress, [0, 0.4, 1], [fromY, fromY * 0.4, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [LATERAL.scaleBranch, LATERAL.scaleBranch + 0.2, 1]);

  if (shouldReduceMotion) {
    return (
      <article id={id} ref={ref} className={`giant-card ${className}`}>
        <div className="giant-card-inner">
          <FloralSideOrnaments scrollProgress={undefined} />
          {children}
        </div>
      </article>
    );
  }

  const style =
    variant === "slideUp"
      ? { opacity, y }
      : variant === "stack"
        ? { opacity, y, scale }
        : variant === "scale"
          ? { opacity, scale }
          : { opacity, y };

  return (
    <motion.article
      id={id}
      ref={ref}
      className={`giant-card ${className}`}
      style={style}
    >
      <div className="giant-card-inner">
        <FloralSideOrnaments scrollProgress={scrollYProgress} />
        {children}
      </div>
    </motion.article>
  );
}
