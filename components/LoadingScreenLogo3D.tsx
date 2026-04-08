"use client";

import Logo3DCanvas from "./Logo3DCanvas";

/** Misma experiencia que antes: GLB dorado en pantalla de carga. */
export default function LoadingScreenLogo3D() {
  return <Logo3DCanvas modelPath="/logos/logo3ddorado.glb" preset="gold" />;
}
