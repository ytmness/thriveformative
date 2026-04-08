"use client";

import { Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Bounds, Center, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { useReducedMotion } from "framer-motion";

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

function RotatingLogo({
  modelPath,
  paused,
  preset,
}: {
  modelPath: string;
  paused: boolean;
  preset: Logo3DPreset;
}) {
  const { scene } = useGLTF(modelPath);
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

  return (
    <div className={className}>
      <Canvas
        camera={{ position: [0, 0, 5], fov: 42 }}
        dpr={[1, 2]}
        gl={{
          alpha: true,
          antialias: true,
          powerPreference: "default",
          failIfMajorPerformanceCaveat: false,
        }}
        className="h-full w-full touch-none"
        onCreated={({ gl }) => {
          gl.setPixelRatio(Math.min(window.devicePixelRatio, 2));
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = exposure;
          if ("outputColorSpace" in gl) {
            (gl as THREE.WebGLRenderer).outputColorSpace = THREE.SRGBColorSpace;
          }
        }}
      >
        <SceneLights preset={preset} />
        <Suspense fallback={null}>
          <RotatingLogo modelPath={modelPath} paused={!!paused} preset={preset} />
        </Suspense>
      </Canvas>
    </div>
  );
}

useGLTF.preload("/logos/logo3ddorado.glb");
useGLTF.preload("/logos/logometal.glb");
