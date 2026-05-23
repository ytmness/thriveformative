"use client";

import { Component, Suspense, useEffect, useRef, useState, type ReactNode } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Bounds, Center, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { useReducedMotion } from "framer-motion";
import { SITE_LOGO_SRC } from "@/lib/branding";

export type Logo3DPreset = "gold" | "metal";

const PRESETS: Record<
  Logo3DPreset,
  {
    ambient: number;
    hemisphere: { sky: string; ground: string; intensity: number };
    directional: Array<{ position: [number, number, number]; intensity: number }>;
    spot: { position: [number, number, number]; angle: number; penumbra: number; intensity: number };
    exposure: number;
    boundsMargin: number;
    rotationSpeed: number;
  }
> = {
  gold: {
    ambient: 0.9,
    hemisphere: { sky: "#fff5e0", ground: "#2a2218", intensity: 0.65 },
    directional: [
      { position: [6, 8, 7], intensity: 1.8 },
      { position: [-5, 3, -4], intensity: 0.75 },
    ],
    spot: { position: [0, 6, 2], angle: 0.55, penumbra: 0.6, intensity: 0.85 },
    exposure: 1.25,
    boundsMargin: 1.2,
    rotationSpeed: 1.05,
  },
  metal: {
    ambient: 0.85,
    hemisphere: { sky: "#f0f4f8", ground: "#252830", intensity: 0.72 },
    directional: [
      { position: [5, 6, 8], intensity: 2.0 },
      { position: [-6, 4, -3], intensity: 0.95 },
      { position: [0, -2, 6], intensity: 0.55 },
    ],
    spot: { position: [2, 8, 4], angle: 0.45, penumbra: 0.55, intensity: 1.0 },
    exposure: 1.12,
    boundsMargin: 1.15,
    rotationSpeed: 1.05,
  },
};

/** Tope de DPR: menos píxeles en móvil sin perder sensación 3D. */
function useAdaptiveDprCap(): number {
  const [cap, setCap] = useState(2);
  useEffect(() => {
    const narrow = window.matchMedia("(max-width: 768px)");
    const short = window.matchMedia("(max-height: 480px)");
    const coarse = window.matchMedia("(pointer: coarse)");
    const update = () => {
      let next = 1.85;
      if (narrow.matches || short.matches) next = 1.65;
      if (coarse.matches && narrow.matches) next = 1.5;
      setCap(next);
    };
    update();
    narrow.addEventListener("change", update);
    short.addEventListener("change", update);
    coarse.addEventListener("change", update);
    return () => {
      narrow.removeEventListener("change", update);
      short.removeEventListener("change", update);
      coarse.removeEventListener("change", update);
    };
  }, []);
  return cap;
}

function RotatingLogo({
  modelPath,
  paused,
  preset,
}: {
  modelPath: string;
  paused: boolean;
  preset: Logo3DPreset;
}) {
  const { scene } = useGLTF(modelPath, true, true);
  const groupRef = useRef<THREE.Group>(null);
  const speed = PRESETS[preset].rotationSpeed;
  const margin = PRESETS[preset].boundsMargin;

  useFrame((_, delta) => {
    if (paused || !groupRef.current) return;
    groupRef.current.rotation.y += delta * speed;
  });

  return (
    <Bounds fit clip={false} margin={margin}>
      <Center>
        <group ref={groupRef}>
          <primitive object={scene} />
        </group>
      </Center>
    </Bounds>
  );
}

function SceneLights({ preset }: { preset: Logo3DPreset }) {
  const p = PRESETS[preset];
  return (
    <>
      <ambientLight intensity={p.ambient} />
      <hemisphereLight intensity={p.hemisphere.intensity} groundColor={p.hemisphere.ground} color={p.hemisphere.sky} />
      {p.directional.map((d, i) => (
        <directionalLight key={i} position={d.position} intensity={d.intensity} />
      ))}
      <spotLight
        position={p.spot.position}
        angle={p.spot.angle}
        penumbra={p.spot.penumbra}
        intensity={p.spot.intensity}
      />
    </>
  );
}

function Logo3DFallback({ className }: { className: string }) {
  return (
    <div className={`${className} flex items-center justify-center`}>
      <img
        src={SITE_LOGO_SRC}
        alt=""
        className="h-28 w-auto max-w-[min(100%,12rem)] object-contain opacity-95"
      />
    </div>
  );
}

class Logo3DErrorBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

export interface Logo3DCanvasProps {
  modelPath: string;
  preset?: Logo3DPreset;
  /** Contenedor del Canvas (altura/ancho vía CSS). */
  className?: string;
}

export default function Logo3DCanvas({
  modelPath,
  preset = "gold",
  className = "h-48 w-48 max-w-[192px] mx-auto [&_canvas]:block [&_canvas]:max-h-[192px]",
}: Logo3DCanvasProps) {
  const paused = useReducedMotion();
  const exposure = PRESETS[preset].exposure;
  const dprCap = useAdaptiveDprCap();
  const fallback = <Logo3DFallback className={className} />;

  return (
    <Logo3DErrorBoundary fallback={fallback}>
      <div className={className}>
        <Canvas
        camera={{ position: [0, 0, 5], fov: 42 }}
        dpr={[1, dprCap]}
        gl={{
          alpha: true,
          antialias: true,
          powerPreference: "high-performance",
          failIfMajorPerformanceCaveat: false,
        }}
        className="h-full w-full touch-none"
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = exposure;
          if ("outputColorSpace" in gl) {
            (gl as THREE.WebGLRenderer).outputColorSpace = THREE.SRGBColorSpace;
          }
        }}
      >
        <SceneLights preset={preset} />
        <Suspense fallback={fallback}>
          <RotatingLogo modelPath={modelPath} paused={!!paused} preset={preset} />
        </Suspense>
      </Canvas>
      </div>
    </Logo3DErrorBoundary>
  );
}
