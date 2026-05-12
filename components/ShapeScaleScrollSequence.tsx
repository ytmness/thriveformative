"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import "@/app/styles/shapescale-sequence.css";

const FRAME_COUNT = 20;

function frameSrc(index: number) {
  const n = String(index + 1).padStart(3, "0");
  return `/shapescale/frames/ezgif-frame-${n}.jpg`;
}

type Props = {
  scrollHint: string;
  sequenceLabel: string;
};

const MAX_DPR = 2;

function progressToFrameIndex(progress: number) {
  const p = Math.min(1, Math.max(0, progress));
  return Math.min(FRAME_COUNT - 1, Math.floor(p * FRAME_COUNT));
}

/** Si el fotograma pedido no cargó, usa el último disponible hacia atrás (evita canvas “congelado”). */
function pickLoadedImageIndex(imgs: HTMLImageElement[], preferred: number): number {
  const max = Math.min(FRAME_COUNT - 1, Math.max(0, preferred));
  for (let i = max; i >= 0; i--) {
    const im = imgs[i];
    if (im?.complete && im.naturalWidth > 0) return i;
  }
  return 0;
}

export default function ShapeScaleScrollSequence({ scrollHint, sequenceLabel }: Props) {
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const imagesReadyRef = useRef(false);

  const frameIndexRef = useRef(0);
  const rafDrawRef = useRef<number | null>(null);
  const [frameIndex, setFrameIndex] = useState(0);

  const drawFrame = useCallback((index: number) => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    const imgs = imagesRef.current;
    if (!canvas || !wrap || imgs.length === 0) return;

    const resolved = pickLoadedImageIndex(imgs, index);
    const img = imgs[resolved];
    if (!img.complete || img.naturalWidth === 0) return;

    const cssW = wrap.clientWidth;
    const cssH = wrap.clientHeight;
    if (cssW < 2 || cssH < 2) return;

    const dpr = Math.min(typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1, MAX_DPR);
    const bufW = Math.max(1, Math.round(cssW * dpr));
    const bufH = Math.max(1, Math.round(cssH * dpr));

    if (canvas.width !== bufW || canvas.height !== bufH) {
      canvas.width = bufW;
      canvas.height = bufH;
    }

    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    const iw = img.naturalWidth;
    const ih = img.naturalHeight;
    const scale = Math.min(cssW / iw, cssH / ih);
    const dw = Math.round(iw * scale);
    const dh = Math.round(ih * scale);
    const dx = Math.round((cssW - dw) / 2);
    const dy = Math.round((cssH - dh) / 2);

    ctx.clearRect(0, 0, cssW, cssH);
    ctx.drawImage(img, dx, dy, dw, dh);
  }, []);

  const scheduleDraw = useCallback(
    (idx: number) => {
      frameIndexRef.current = idx;
      if (rafDrawRef.current != null) {
        cancelAnimationFrame(rafDrawRef.current);
      }
      rafDrawRef.current = requestAnimationFrame(() => {
        rafDrawRef.current = null;
        if (!imagesReadyRef.current) return;
        drawFrame(idx);
      });
    },
    [drawFrame]
  );

  const updateFromScroll = useCallback(() => {
    const el = sectionRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const sectionH = rect.height;
    const viewH = window.innerHeight;
    const range = Math.max(sectionH - viewH, 1);
    const raw = -rect.top / range;
    const p = Math.min(1, Math.max(0, raw));
    const idx = progressToFrameIndex(p);

    frameIndexRef.current = idx;
    setFrameIndex((prev) => (prev === idx ? prev : idx));
    scheduleDraw(idx);
  }, [scheduleDraw]);

  const updateFromScrollRef = useRef(updateFromScroll);
  updateFromScrollRef.current = updateFromScroll;

  useEffect(() => {
    const imgs = Array.from({ length: FRAME_COUNT }, (_, i) => {
      const im = new Image();
      im.decoding = "async";
      im.src = frameSrc(i);
      return im;
    });
    imagesRef.current = imgs;

    let cancelled = false;
    Promise.all(
      imgs.map(
        (im) =>
          new Promise<void>((resolve) => {
            if (im.complete && im.naturalWidth > 0) {
              resolve();
              return;
            }
            im.onload = () => resolve();
            im.onerror = () => resolve();
          })
      )
    ).then(() => {
      if (cancelled) return;
      imagesReadyRef.current = true;
      updateFromScrollRef.current();
    });

    return () => {
      cancelled = true;
      imagesReadyRef.current = false;
      imgs.forEach((im) => {
        im.onload = null;
        im.onerror = null;
      });
    };
  }, []);

  useEffect(() => {
    let raf = 0;
    let ticking = false;
    const tick = () => {
      ticking = false;
      updateFromScroll();
    };
    const onScrollOrResize = () => {
      if (ticking) return;
      ticking = true;
      raf = requestAnimationFrame(tick);
    };

    updateFromScroll();
    window.addEventListener("scroll", onScrollOrResize, { passive: true });
    window.addEventListener("resize", onScrollOrResize, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScrollOrResize);
      window.removeEventListener("resize", onScrollOrResize);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [updateFromScroll]);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => {
      updateFromScrollRef.current();
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => {
      scheduleDraw(frameIndexRef.current);
    });
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [scheduleDraw]);

  useEffect(() => {
    return () => {
      if (rafDrawRef.current != null) {
        cancelAnimationFrame(rafDrawRef.current);
      }
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="shapescale-sequence relative min-h-[320vh] w-full"
      aria-label={sequenceLabel}
    >
      <div className="sticky top-[4.5rem] flex min-h-[calc(100svh-4.5rem)] w-full flex-col items-center justify-center gap-4 px-3 pb-6 pt-4 sm:px-6">
        <div className="relative mx-auto w-full max-w-[min(100%,96rem)] flex-1">
          <div
            ref={wrapRef}
            className="shapescale-sequence__canvas-wrap relative w-full overflow-hidden rounded-2xl border border-[rgb(var(--border)/0.18)] bg-[rgb(var(--surface)/0.35)] shadow-soft"
          >
            <canvas ref={canvasRef} className="block h-full w-full" aria-hidden />
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
