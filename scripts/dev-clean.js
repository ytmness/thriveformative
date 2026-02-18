#!/usr/bin/env node
/**
 * Arranca el dev server tras borrar .next (evita errores de caché corrupta)
 */
const fs = require("fs");
const path = require("path");

const nextDir = path.join(__dirname, "..", ".next");
if (fs.existsSync(nextDir)) {
  fs.rmSync(nextDir, { recursive: true, force: true });
  console.log("✓ .next eliminado");
}

require("child_process").execSync("npx next dev", {
  stdio: "inherit",
  cwd: path.join(__dirname, ".."),
});
