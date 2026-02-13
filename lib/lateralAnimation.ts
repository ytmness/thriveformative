/**
 * Configuración compartida para animaciones al estilo de FloralSideOrnaments
 * (laterales de Functional Medicine) — todo el sitio usa el mismo patrón
 */

export const LATERAL = {
  fromY: 55,
  durationFlower: 0.92,
  durationBranch: 0.78,
  staggerBase: 0.005,
  staggerMax: 1.4,
  ease: [0.22, 0.61, 0.36, 1] as const,
  scaleFlower: 0.2,
  scaleBranch: 0.75,
  rotateFlower: 480,
};
