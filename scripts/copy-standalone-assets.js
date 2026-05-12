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

console.log("[copy-standalone-assets] Listo.");
