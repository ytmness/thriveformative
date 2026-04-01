"use client";

import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { useScrollDirection } from "@/lib/useScrollDirection";
import { LATERAL } from "@/lib/lateralAnimation";
import { useIsTouchDevice } from "@/lib/useIsTouchDevice";

interface AnimatedSectionProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  direction?: "up" | "down" | "left" | "right" | "fade";
}

export default function AnimatedSection({ 
  children, 
  className = "", 
  delay = 0,
  direction = "up" 
}: AnimatedSectionProps) {
  const ref = useRef(null);
  const isTouchDevice = useIsTouchDevice();
  const isInView = useInView(ref, { once: true, margin: "-100px", amount: 0.02 });
  const scrollDirection = useScrollDirection();
  const fromY = scrollDirection === "down" ? LATERAL.fromY : -LATERAL.fromY;

  const variants = {
    up: {
      hidden: { opacity: 0, y: fromY },
      visible: { opacity: 1, y: 0 },
    },
    down: {
      hidden: { opacity: 0, y: -fromY },
      visible: { opacity: 1, y: 0 },
    },
    left: {
      hidden: { opacity: 0, x: -LATERAL.fromY },
      visible: { opacity: 1, x: 0 },
    },
    right: {
      hidden: { opacity: 0, x: LATERAL.fromY },
      visible: { opacity: 1, x: 0 },
    },
    fade: {
      hidden: { opacity: 0 },
      visible: { opacity: 1 },
    },
  };

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isTouchDevice || isInView ? "visible" : "hidden"}
      variants={variants[direction]}
      transition={{
        duration: LATERAL.durationFlower,
        delay,
        ease: LATERAL.ease,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
