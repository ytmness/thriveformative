"use client";

import { useRef, useEffect, useState, useMemo } from "react";
import { useScroll, useMotionValueEvent } from "framer-motion";

const FRAME_COUNT = 20;

function frameSrc(index: number) {
  const n = String(index + 1).padStart(3, "0");
  return `/shapescale/frames/ezgif-frame-${n}.jpg`;
}

type Props = {
  scrollHint: string;
  sequenceLabel: string;
};

export default function ShapeScaleScrollSequence({ scrollHint, sequenceLabel }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [frameIndex, setFrameIndex] = useState(0);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    const idx = Math.round(latest * (FRAME_COUNT - 1));
    const clamped = Math.max(0, Math.min(FRAME_COUNT - 1, idx));
    setFrameIndex((prev) => (prev === clamped ? prev : clamped));
  });

  useEffect(() => {
    for (let i = 0; i < FRAME_COUNT; i++) {
      const img = new Image();
      img.src = frameSrc(i);
    }
  }, []);

  const src = useMemo(() => frameSrc(frameIndex), [frameIndex]);

  return (
    <div ref={containerRef} className="relative min-h-[320vh] w-full">
      <div className="sticky top-[4.5rem] flex h-[calc(100vh-4.5rem)] max-h-[100dvh] flex-col items-center justify-center gap-6 px-4 py-8">
        <div className="relative flex max-h-[min(72vh,640px)] w-full max-w-4xl flex-1 items-center justify-center">
          <img
            src={src}
            alt={`${sequenceLabel} — ${frameIndex + 1} / ${FRAME_COUNT}`}
            className="max-h-full max-w-full object-contain select-none"
            draggable={false}
            decoding="async"
          />
        </div>
        <p className="type-caption max-w-md text-center text-[rgb(var(--muted))]">{scrollHint}</p>
      </div>
    </div>
  );
}
