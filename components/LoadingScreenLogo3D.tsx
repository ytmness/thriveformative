"use client";

import { useGLTF } from "@react-three/drei";
import Logo3DCanvas from "./Logo3DCanvas";

/** GLB con meshopt + texturas WebP: precarga con mismos decoders que useGLTF. */
useGLTF.preload("/logos/logo3ddorado.glb", true, true);

/** Misma experiencia que antes: GLB dorado en pantalla de carga. */
export default function LoadingScreenLogo3D() {
  return <Logo3DCanvas modelPath="/logos/logo3ddorado.glb" preset="gold" />;
}
