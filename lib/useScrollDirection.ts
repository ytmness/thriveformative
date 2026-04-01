"use client";

import { useEffect, useRef, useState } from "react";
import { useScroll, useMotionValueEvent } from "framer-motion";

export function useScrollDirection(): "down" | "up" {
  const [direction, setDirection] = useState<"down" | "up">("down");
  const { scrollY } = useScroll();
  const prev = useRef(0);
  const directionRef = useRef<"down" | "up">("down");
  const isMobileRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const media = window.matchMedia("(max-width: 1024px), (pointer: coarse)");

    const update = () => {
      isMobileRef.current = media.matches;
    };

    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useMotionValueEvent(scrollY, "change", (v) => {
    // En móvil evitamos trabajo extra de animaciones dependientes del scroll.
    if (isMobileRef.current) {
      prev.current = v;
      return;
    }

    const delta = v - prev.current;
    if (Math.abs(delta) < 8) return;

    const next: "down" | "up" = delta > 0 ? "down" : "up";
    if (next !== directionRef.current) {
      directionRef.current = next;
      setDirection(next);
    }
    prev.current = v;
  });

  return direction;
}
