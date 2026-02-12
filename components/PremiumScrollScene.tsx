"use client";

import { useRef } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
  MotionValue,
} from "framer-motion";
import { useTranslations } from "next-intl";

/* ───────────────────────────────────────────
   Premium scroll experience — editorial-style
   pinned section with timeline-driven animations.
   Respects prefers-reduced-motion.
   ─────────────────────────────────────────── */

const SCENE_HEIGHT_VH = 200;
const TILE_POSITIONS = [
  { top: "12%", right: "8%", delay: 0.1 },
  { bottom: "18%", left: "12%", delay: 0.25 },
  { top: "35%", left: "5%", delay: 0.4 },
] as const;

interface TileProps {
  label: string;
  position: (typeof TILE_POSITIONS)[number];
  progress: MotionValue<number>;
  reducedMotion: boolean;
}

function SceneTile({ label, position, progress, reducedMotion }: TileProps) {
  const opacity = useTransform(progress, [0.08, 0.28], [0, 1]);
  const y = useTransform(progress, [0.1, 0.35], [30, 0]);
  const scale = useTransform(progress, [0.08, 0.3], [0.9, 1]);

  const positionStyle = {
    top: "top" in position ? position.top : undefined,
    bottom: "bottom" in position ? position.bottom : undefined,
    left: "left" in position ? position.left : undefined,
    right: "right" in position ? position.right : undefined,
  };

  if (reducedMotion) {
    return (
      <div className="tile" style={positionStyle}>
        <span className="tile-label">{label}</span>
      </div>
    );
  }

  return (
    <motion.div
      className="tile"
      style={{
        ...positionStyle,
        opacity,
        y,
        scale,
      }}
    >
      <span className="tile-label">{label}</span>
    </motion.div>
  );
}

export default function PremiumScrollScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const t = useTranslations("premiumScene");

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  // Timeline mappings — scroll progress 0→1 (más compacto para completar antes)
  const titleOpacity = useTransform(scrollYProgress, [0, 0.12], [0.3, 1]);
  const titleY = useTransform(scrollYProgress, [0, 0.18], [24, 0]);
  const wipe1Progress = useTransform(scrollYProgress, [0.05, 0.2], [0, 1]);
  const wipe2Progress = useTransform(scrollYProgress, [0.15, 0.35], [0, 1]);
  const topoOpacity = useTransform(scrollYProgress, [0, 0.25], [0.03, 0.08]);
  const bgShift = useTransform(scrollYProgress, [0, 0.5], [0, 0.05]);

  const staticFallback = !!shouldReduceMotion;

  return (
    <div
      ref={containerRef}
      className="scene-wrap"
      style={{ minHeight: `${SCENE_HEIGHT_VH}vh` }}
    >
      <div className="scene-stage">
        {/* Subtle topo/line-art background */}
        <motion.div
          className="scene-topo"
          style={
            staticFallback
              ? { opacity: 0.05 }
              : { opacity: topoOpacity }
          }
          aria-hidden
        />

        {/* Gradient background shift */}
        {!staticFallback && (
          <motion.div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `linear-gradient(
                135deg,
                transparent 0%,
                rgb(var(--primary) / 0.03) 50%,
                transparent 100%
              )`,
              opacity: bgShift,
            }}
          />
        )}

        <div className="relative z-10 flex flex-col items-center justify-center min-h-full px-6 py-16">
          {/* Title with wipe accents */}
          <motion.h2
            className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl tracking-wide text-center max-w-4xl"
            style={
              staticFallback
                ? {}
                : {
                    opacity: titleOpacity,
                    y: titleY,
                  }
            }
          >
            <span className="wipe">
              {t("word1")}
              {!staticFallback && (
                <motion.span
                  className="wipe-bar"
                  style={{ scaleX: wipe1Progress }}
                  aria-hidden
                />
              )}
            </span>
            {" — "}
            <span className="wipe">
              {t("word2")}
              {!staticFallback && (
                <motion.span
                  className="wipe-bar"
                  style={{ scaleX: wipe2Progress }}
                  aria-hidden
                />
              )}
            </span>
            {" "}
            {t("titleSuffix")}
          </motion.h2>

          {/* Collage tiles */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <SceneTile
              label={t("tile1")}
              position={TILE_POSITIONS[0]}
              progress={scrollYProgress}
              reducedMotion={staticFallback}
            />
            <SceneTile
              label={t("tile2")}
              position={TILE_POSITIONS[1]}
              progress={scrollYProgress}
              reducedMotion={staticFallback}
            />
            <SceneTile
              label={t("tile3")}
              position={TILE_POSITIONS[2]}
              progress={scrollYProgress}
              reducedMotion={staticFallback}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
