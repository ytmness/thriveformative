/**
 * Tras `next build` con `output: 'standalone'`, Next no copia solo `.next/static` ni `public/`.
 * Sin esto, producción devuelve 404 en `/_next/static/*` y en `/logos/*`, etc.
 *
 * Se ejecuta desde `npm run postbuild` (automático después de `next build`).
 */
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const standalone = path.join(root, ".next", "standalone");
const serverJs = path.join(standalone, "server.js");
const staticSrc = path.join(root, ".next", "static");
const staticDest = path.join(standalone, ".next", "static");
const publicSrc = path.join(root, "public");
const publicDest = path.join(standalone, "public");

/** Archivos críticos que deben existir tras la copia (evita 404 silenciosos en prod). */
const REQUIRED_IN_PUBLIC = [
  "logos/Logo-Golden-Sand-color-06.png",
  "logos/Black-Gradient-Logo-02.png",
  "logos/t-shape-2-1.png",
  "logos/fda-approved.png",
  "logos/logo3ddorado.glb",
  "logos/logometal.glb",
  "shapescale/step-full.png",
  "shapescale/step-head.png",
];

if (!fs.existsSync(serverJs)) {
  console.log(
    "[copy-standalone-assets] Omitido: no existe .next/standalone/server.js (¿build sin standalone?)."
  );
  process.exit(0);
}

if (!fs.existsSync(staticSrc)) {
  console.error("[copy-standalone-assets] ERROR: falta .next/static — el build no generó estáticos.");
  process.exit(1);
}

if (!fs.existsSync(publicSrc)) {
  console.error("[copy-standalone-assets] ERROR: falta la carpeta public/. ");
  process.exit(1);
}

function rmrf(dir) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

console.log("[copy-standalone-assets] .next/static → .next/standalone/.next/static");
fs.mkdirSync(path.join(standalone, ".next"), { recursive: true });
rmrf(staticDest);
fs.cpSync(staticSrc, staticDest, { recursive: true });

console.log("[copy-standalone-assets] public → .next/standalone/public");
rmrf(publicDest);
fs.cpSync(publicSrc, publicDest, { recursive: true });

const chunkCount = fs.existsSync(path.join(staticDest, "chunks"))
  ? fs.readdirSync(path.join(staticDest, "chunks")).filter((f) => f.endsWith(".js")).length
  : 0;
if (chunkCount === 0) {
  console.error("[copy-standalone-assets] ERROR: no hay chunks JS en standalone/.next/static/chunks");
  process.exit(1);
}

let missing = [];
for (const rel of REQUIRED_IN_PUBLIC) {
  const dest = path.join(publicDest, rel);
  if (!fs.existsSync(dest)) {
    missing.push(rel);
  }
}

if (missing.length > 0) {
  console.error("[copy-standalone-assets] ERROR: faltan archivos en standalone/public:");
  missing.forEach((m) => console.error("  -", m));
  process.exit(1);
}

const logoCount = fs.readdirSync(path.join(publicDest, "logos")).length;
console.log(`[copy-standalone-assets] OK: ${chunkCount} chunks JS, ${logoCount} archivos en public/logos`);
console.log("[copy-standalone-assets] Listo.");
