"use client";

import { useRef, useEffect, useState, useCallback } from "react";

const FRAME_COUNT = 20;

function frameSrc(index: number) {
  const n = String(index + 1).padStart(3, "0");
  return `/shapescale/frames/ezgif-frame-${n}.jpg`;
}

type Props = {
  scrollHint: string;
  sequenceLabel: string;
};

/** Altura del área de scroll = varias vistas; así el scrub va de frame 0 → último de forma clara */
const SCROLL_SECTION_VH = 3.2;

export default function ShapeScaleScrollSequence({ scrollHint, sequenceLabel }: Props) {
  const sectionRef = useRef<HTMLElement>(null);
  const [frameIndex, setFrameIndex] = useState(0);
  const frameIndexRef = useRef(0);

  const updateProgress = useCallback(() => {
    const el = sectionRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const vh = window.innerHeight;
    const scrollRange = Math.max(rect.height - vh, 1);
    let p = -rect.top / scrollRange;
    p = Math.min(1, Math.max(0, p));

    const idx = Math.min(FRAME_COUNT - 1, Math.floor(p * FRAME_COUNT));

    if (idx !== frameIndexRef.current) {
      frameIndexRef.current = idx;
      setFrameIndex(idx);
    }
  }, []);

  useEffect(() => {
    let ticking = false;
    const onScrollOrResize = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        updateProgress();
      });
    };

    updateProgress();
    window.addEventListener("scroll", onScrollOrResize, { passive: true });
    window.addEventListener("resize", onScrollOrResize, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScrollOrResize);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, [updateProgress]);

  return (
    <section
      ref={sectionRef}
      className="relative w-full"
      style={{ minHeight: `${SCROLL_SECTION_VH * 100}vh` }}
      aria-label={sequenceLabel}
    >
      <div className="sticky top-[4.5rem] flex min-h-[calc(100svh-4.5rem)] w-full flex-col items-center justify-center gap-4 px-3 pb-6 pt-4 sm:px-6">
        <div className="relative mx-auto w-full max-w-[min(100%,96rem)] flex-1">
          <div
            className="relative w-full overflow-hidden rounded-2xl border border-[rgb(var(--border)/0.18)] bg-[rgb(var(--surface)/0.35)] shadow-soft"
            style={{
              height: "min(82svh, calc(100dvh - 6rem))",
              minHeight: "min(70svh, 520px)",
            }}
          >
            {Array.from({ length: FRAME_COUNT }, (_, i) => (
              <img
                key={i}
                src={frameSrc(i)}
                alt=""
                aria-hidden={i !== frameIndex}
                draggable={false}
                loading="eager"
                decoding="async"
                className={`absolute inset-0 h-full w-full object-contain ${
                  i === frameIndex ? "opacity-100 z-[1]" : "opacity-0 z-0 pointer-events-none"
                }`}
              />
            ))}
            <span className="sr-only">
              {sequenceLabel}, fotograma {frameIndex + 1} de {FRAME_COUNT}
            </span>
          </div>
        </div>
        <p className="type-caption max-w-lg shrink-0 px-2 text-center text-[rgb(var(--muted))]">
          {scrollHint}
        </p>
      </div>
    </section>
  );
}
