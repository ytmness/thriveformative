"use client";

import { Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Bounds, Center, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { useReducedMotion } from "framer-motion";

const MODEL_URL = "/logos/logo3ddorado.glb";

useGLTF.preload(MODEL_URL);

function RotatingLogo({ paused }: { paused: boolean }) {
  const { scene } = useGLTF(MODEL_URL);
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (paused || !groupRef.current) return;
    groupRef.current.rotation.y += delta * 0.65;
  });

  return (
    <Bounds fit clip margin={1.15}>
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
    <div className="h-48 w-48 max-w-[192px] mx-auto [&_canvas]:block">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 42 }}
        dpr={[1, 1.75]}
        gl={{
          alpha: true,
          antialias: true,
          powerPreference: "default",
          failIfMajorPerformanceCaveat: false,
        }}
        className="h-full w-full touch-none"
        onCreated={({ gl }) => {
          gl.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        }}
      >
        <ambientLight intensity={0.78} />
        <directionalLight position={[5, 8, 6]} intensity={1.12} />
        <directionalLight position={[-4, 2, -3]} intensity={0.38} />
        <Suspense fallback={null}>
          <RotatingLogo paused={!!paused} />
        </Suspense>
      </Canvas>
    </div>
  );
}
