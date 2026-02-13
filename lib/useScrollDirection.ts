"use client";

import { useState, useRef } from "react";
import { useScroll, useMotionValueEvent } from "framer-motion";

export function useScrollDirection(): "down" | "up" {
  const [direction, setDirection] = useState<"down" | "up">("down");
  const { scrollY } = useScroll();
  const prev = useRef(0);

  useMotionValueEvent(scrollY, "change", (v) => {
    setDirection(v > prev.current ? "down" : "up");
    prev.current = v;
  });

  return direction;
}
