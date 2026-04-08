"use client";

import Logo3DCanvas from "./Logo3DCanvas";

/** Logo metálico 3D para la pantalla «Próximamente» (misma base que la carga). */
export default function ComingSoonLogo3D() {
  return (
    <div className="coming-soon-page__logo-3d-shell">
      <Logo3DCanvas
        modelPath="/logos/logometal.glb"
        preset="metal"
        className="coming-soon-page__logo-3d"
      />
    </div>
  );
}
