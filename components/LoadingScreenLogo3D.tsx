"use client";

import { Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Bounds, Center, Environment, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { useReducedMotion } from "framer-motion";

/** Ruta bajo `public/logos/` — Nginx debe servir `/logos/*.glb`. */
const MODEL_PATH = "/logos/logo3ddorado.glb";

useGLTF.preload(MODEL_PATH);

function RotatingLogo({ paused }: { paused: boolean }) {
  const { scene } = useGLTF(MODEL_PATH);
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (paused || !groupRef.current) return;
    groupRef.current.rotation.y += delta * 0.65;
  });

  return (
    <Bounds fit clip={false} margin={1.2}>
      <Center>
        <group ref={groupRef}>
          <primitive object={scene} />
        </group>
      </Center>
    </Bounds>
  );
}

export default function LoadingScreenLogo3D() {
  const paused = useReducedMotion();

  return (
    <div className="h-48 w-48 max-w-[192px] mx-auto [&_canvas]:block [&_canvas]:max-h-[192px]">
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
          gl.toneMappingExposure = 1.05;
        }}
      >
        <ambientLight intensity={0.55} />
        <hemisphereLight intensity={0.45} groundColor="#1a1510" color="#fff8e8" />
        <directionalLight position={[6, 8, 7]} intensity={1.35} />
        <directionalLight position={[-5, 3, -4]} intensity={0.45} />
        <spotLight position={[0, 6, 2]} angle={0.55} penumbra={0.6} intensity={0.55} />
        {/* Oro / PBR: sin entorno el metal se ve negro o plano */}
        <Environment preset="studio" environmentIntensity={0.85} />
        <Suspense fallback={null}>
          <RotatingLogo paused={!!paused} />
        </Suspense>
      </Canvas>
    </div>
  );
}
