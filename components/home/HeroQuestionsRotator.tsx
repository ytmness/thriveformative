"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";

const INTERVAL_MS = 4200;
const FADE_MS = 0.55;

type Props = {
  questions: string[];
};

export default function HeroQuestionsRotator({ questions }: Props) {
  const reducedMotion = useReducedMotion();
  const items = questions.map((q) => q.trim()).filter(Boolean);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (items.length <= 1 || reducedMotion) return;
    const id = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % items.length);
    }, INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [items.length, reducedMotion]);

  if (items.length === 0) return null;

  const active = items[Math.min(index, items.length - 1)];

  return (
    <div
      className="hero-editorial__questions"
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="hero-editorial__questions-slot">
        {reducedMotion || items.length === 1 ? (
          <p className="hero-editorial__question">{items[0]}</p>
        ) : (
          <AnimatePresence mode="wait" initial={false}>
            <motion.p
              key={`${index}-${active}`}
              className="hero-editorial__question"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: FADE_MS, ease: [0.22, 1, 0.36, 1] }}
            >
              {active}
            </motion.p>
          </AnimatePresence>
        )}
      </div>
      {items.length > 1 && !reducedMotion ? (
        <div className="hero-editorial__questions-dots" aria-hidden>
          {items.map((_, i) => (
            <span
              key={i}
              className={`hero-editorial__questions-dot${
                i === index ? " is-active" : ""
              }`}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
