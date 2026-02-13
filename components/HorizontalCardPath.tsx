"use client";

import { useMemo, useRef } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";

const FLOR_IMAGES = ["/floral/flor-1.png", "/floral/flor-2.png", "/floral/flor-3.png", "/floral/flor-4.png", "/floral/flor-5.png"];
const FLOWER_SIZES = ["w-13 h-13 md:w-16 md:h-16", "w-10 h-10 md:w-13 md:h-13", "w-16 h-16 md:w-18 md:h-18", "w-12 h-12 md:w-14 md:h-14", "w-9 h-9 md:w-12 md:h-12"];

interface FlowerDef {
  left?: string;
  right?: string;
  size: string;
  florVariant: number;
  zIndex: number;
  orderKey: number;
}

function generateFlowers(): FlowerDef[] {
  const items: FlowerDef[] = [];
  let orderKey = 0;
  const positionsLeft = ["-2%", "8%", "18%", "28%", "40%", "50%", "58%"];
  const positionsRight = ["-2%", "8%", "18%", "28%", "40%", "50%", "58%"];
  positionsLeft.forEach((left, i) => {
    items.push({
      left,
      size: FLOWER_SIZES[i % FLOWER_SIZES.length],
      florVariant: i % 5,
      zIndex: 2 + (i % 3),
      orderKey: orderKey++,
    });
  });
  positionsRight.forEach((right, i) => {
    items.push({
      right,
      size: FLOWER_SIZES[(i + 2) % FLOWER_SIZES.length],
      florVariant: (i + 1) % 5,
      zIndex: 2 + (i % 3),
      orderKey: orderKey++,
    });
  });
  return items;
}

function FlorImage({ variant }: { variant: number }) {
  const src = FLOR_IMAGES[variant % FLOR_IMAGES.length];
  return (
    <img src={src} alt="" className="block w-full h-full object-contain" aria-hidden draggable={false} />
  );
}

export default function HorizontalCardPath() {
  const flowers = useMemo(() => generateFlowers(), []);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(wrapperRef, { once: false, amount: 0.1 });
  const shouldReduceMotion = useReducedMotion();
  const STAGGER_BASE = 0.01;

  const closedLeft = shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scaleX: 0 };
  const openLeft = { opacity: 1, scaleX: 1 };
  const closedRight = shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scaleX: 0 };
  const openRight = { opacity: 1, scaleX: 1 };

  const leftFlowers = flowers.filter((f) => f.left !== undefined);
  const rightFlowers = flowers.filter((f) => f.right !== undefined);

  return (
    <div ref={wrapperRef} className="horizontal-card-path" aria-hidden>
      <motion.div
        className="horizontal-path-side horizontal-path-left"
        initial={closedLeft}
        animate={isInView ? openLeft : closedLeft}
        transition={{
          duration: shouldReduceMotion ? 0.25 : 0.55,
          ease: [0.22, 0.61, 0.36, 1],
        }}
      >
        {leftFlowers.map((item, i) => {
          const staggerDelay = Math.min(i * STAGGER_BASE, 0.5);
          const hiddenState = shouldReduceMotion
            ? { opacity: 0 }
            : { opacity: 0, scale: 0.8 };
          const visibleState = { opacity: 1, scale: 1 };
          return (
            <motion.div
              key={`left-flor-${item.orderKey}`}
              className={`horizontal-path-flower absolute ${item.size}`}
              style={{ left: item.left, zIndex: item.zIndex }}
              initial={hiddenState}
              animate={isInView ? visibleState : hiddenState}
              transition={{
                duration: shouldReduceMotion ? 0.3 : 0.6,
                delay: isInView ? (shouldReduceMotion ? 0 : staggerDelay) : 0,
                ease: [0.22, 0.61, 0.36, 1],
              }}
            >
              <FlorImage variant={item.florVariant} />
            </motion.div>
          );
        })}
      </motion.div>
      <motion.div
        className="horizontal-path-side horizontal-path-right"
        initial={closedRight}
        animate={isInView ? openRight : closedRight}
        transition={{
          duration: shouldReduceMotion ? 0.25 : 0.55,
          ease: [0.22, 0.61, 0.36, 1],
        }}
      >
        {rightFlowers.map((item, i) => {
          const staggerDelay = Math.min(i * STAGGER_BASE, 0.5);
          const hiddenState = shouldReduceMotion
            ? { opacity: 0 }
            : { opacity: 0, scale: 0.8 };
          const visibleState = { opacity: 1, scale: 1 };
          return (
            <motion.div
              key={`right-flor-${item.orderKey}`}
              className={`horizontal-path-flower horizontal-path-flower--right absolute ${item.size}`}
              style={{ right: item.right, zIndex: item.zIndex }}
              initial={hiddenState}
              animate={isInView ? visibleState : hiddenState}
              transition={{
                duration: shouldReduceMotion ? 0.3 : 0.6,
                delay: isInView ? (shouldReduceMotion ? 0 : staggerDelay) : 0,
                ease: [0.22, 0.61, 0.36, 1],
              }}
            >
              <div className="w-full h-full floral-ornament-mirror">
                <FlorImage variant={item.florVariant} />
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
