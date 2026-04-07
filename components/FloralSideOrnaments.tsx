"use client";

import { useRef } from "react";
import { motion, useReducedMotion, useInView } from "framer-motion";
import { useScrollDirection } from "@/lib/useScrollDirection";
import { LATERAL } from "@/lib/lateralAnimation";
import { useIsTouchDevice } from "@/lib/useIsTouchDevice";

const SIDE_LOOP_IMAGE = "/floral/guias3.png";

export default function FloralSideOrnaments() {
  const shouldReduceMotion = useReducedMotion();
  const isTouchDevice = useIsTouchDevice();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(wrapperRef, { once: false, amount: 0.02 });
  const shouldShow = isTouchDevice || isInView;
  const scrollDirection = useScrollDirection();
  const fromY = scrollDirection === "down" ? LATERAL.fromY : -LATERAL.fromY;

  const hiddenState = shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: fromY };
  const visibleState = { opacity: 1, y: 0 };

  return (
    <div ref={wrapperRef} className="floral-arbor-wrapper floral-arbor-wrapper--extended" aria-hidden>
      <motion.div
        className="floral-side-loop"
        style={{ backgroundImage: `url(${SIDE_LOOP_IMAGE})` }}
        initial={hiddenState}
        animate={shouldShow ? visibleState : hiddenState}
        transition={{
          duration: shouldReduceMotion ? 0.3 : LATERAL.durationBranch,
          delay: 0,
          ease: LATERAL.ease,
        }}
      />
    </div>
  );
}
