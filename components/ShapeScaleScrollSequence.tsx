"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "@/app/styles/shapescale-sequence.css";

/** Total de JPG en `public/shapescale/frames/` (ezgif-frame-001 … ezgif-frame-300). */
const FRAME_COUNT = 300;

/** Píxeles de scroll mientras la sección está pinneada (~17px/frame a 300 frames; mínimo 5000). */
const PIN_SCROLL_PX = Math.max(5000, FRAME_COUNT * 16);

function frameSrc(index: number) {
  const n = String(index + 1).padStart(3, "0");
  return `/shapescale/frames/ezgif-frame-${n}.jpg`;
}

type Props = {
  scrollHint: string;
  sequenceLabel: string;
};

const MAX_DPR = 2;

/** Progreso 0→1 → índice de fotograma 0…299 (último frame al completar el pin). */
function progressToFrameIndex(progress: number) {
  const p = Math.min(1, Math.max(0, progress));
  return Math.min(FRAME_COUNT - 1, Math.floor(p * FRAME_COUNT));
}

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
  const [assetsReady, setAssetsReady] = useState(false);

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
    /* contain: imagen completa visible, sin recortes (evita saltos de layout por recorte) */
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

  const scheduleDrawRef = useRef(scheduleDraw);
  scheduleDrawRef.current = scheduleDraw;

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
      setAssetsReady(true);
    });

    return () => {
      cancelled = true;
      imagesReadyRef.current = false;
      setAssetsReady(false);
      imgs.forEach((im) => {
        im.onload = null;
        im.onerror = null;
      });
    };
  }, []);

  useEffect(() => {
    if (!assetsReady) return;

    gsap.registerPlugin(ScrollTrigger);

    const section = sectionRef.current;
    if (!section) return;

    const progressObj = { value: 0 };

    const applyFrameFromProgress = (raw: number) => {
      const idx = progressToFrameIndex(raw);
      frameIndexRef.current = idx;
      setFrameIndex((prev) => (prev === idx ? prev : idx));
      scheduleDrawRef.current(idx);
    };

    const tween = gsap.to(progressObj, {
      value: 1,
      ease: "none",
      scrollTrigger: {
        trigger: section,
        start: "top top",
        end: `+=${PIN_SCROLL_PX}`,
        pin: true,
        scrub: true,
        invalidateOnRefresh: true,
      },
      onUpdate: () => {
        applyFrameFromProgress(progressObj.value);
      },
    });

    applyFrameFromProgress(0);
    requestAnimationFrame(() => {
      ScrollTrigger.refresh();
      applyFrameFromProgress(progressObj.value);
    });

    const onResize = () => {
      ScrollTrigger.refresh();
      scheduleDrawRef.current(frameIndexRef.current);
    };
    window.addEventListener("resize", onResize, { passive: true });

    return () => {
      window.removeEventListener("resize", onResize);
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, [assetsReady]);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => {
      ScrollTrigger.refresh();
      scheduleDrawRef.current(frameIndexRef.current);
    });
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [assetsReady]);

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
      className="shapescale-sequence relative w-full"
      aria-label={sequenceLabel}
    >
      <div className="shapescale-sequence__sticky">
        <div ref={wrapRef} className="shapescale-sequence__stage">
          <canvas ref={canvasRef} className="shapescale-sequence__canvas" aria-hidden />
          <span className="sr-only">
            {sequenceLabel}, fotograma {frameIndex + 1} de {FRAME_COUNT}
          </span>
          <p className="type-caption shapescale-sequence__hint">{scrollHint}</p>
        </div>
      </div>
    </section>
  );
}
