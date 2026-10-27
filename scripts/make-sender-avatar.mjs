import { execFileSync } from "child_process";
import fs from "fs";
import http from "http";
import os from "os";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const outGif = path.join(root, "public", "emails", "sender-avatar.gif");
const outPng = path.join(root, "public", "emails", "sender-avatar.png");
const htmlPath = path.join(root, "scripts", "sender-avatar-3d.html");
const glbPath = path.join(root, "public", "logos", "logo3ddorado.glb");

const SIZE = 512;
const FRAMES = 48;
const FPS = 12;
const EDGE =
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json",
  ".glb": "model/gltf-binary",
  ".wasm": "application/wasm",
  ".css": "text/css; charset=utf-8",
};

function startServer() {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const urlPath = decodeURIComponent((req.url || "/").split("?")[0]);
      let rel = urlPath === "/" ? "scripts/sender-avatar-3d.html" : urlPath.slice(1);
      if (rel.startsWith("logos/")) rel = `public/${rel}`;
      const file = path.resolve(root, rel);
      if (!file.startsWith(root)) {
        res.writeHead(403);
        res.end();
        return;
      }
      fs.readFile(file, (err, data) => {
        if (err) {
          res.writeHead(404);
          res.end("not found");
          return;
        }
        res.writeHead(200, { "Content-Type": MIME[path.extname(file)] || "application/octet-stream" });
        res.end(data);
      });
    });
    server.listen(0, "127.0.0.1", () => {
      const addr = server.address();
      resolve({ server, port: addr.port });
    });
    server.on("error", reject);
  });
}

async function loadPuppeteer() {
  try {
    return await import("puppeteer-core");
  } catch {
    execFileSync("npm", ["install", "puppeteer-core@24.22.3", "--no-save", "--no-fund", "--no-audit"], {
      cwd: root,
      stdio: "inherit",
      shell: true,
    });
    return import(pathToFileURL(path.join(root, "node_modules", "puppeteer-core", "lib", "esm", "puppeteer", "puppeteer-core.js")).href);
  }
}

async function main() {
  if (!fs.existsSync(glbPath)) throw new Error(`No está el GLB: ${glbPath}`);
  if (!fs.existsSync(htmlPath)) throw new Error(`No está el HTML: ${htmlPath}`);
  if (!fs.existsSync(EDGE)) throw new Error(`No está Edge: ${EDGE}`);

  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "thrive-avatar-"));
  const { server, port } = await startServer();
  const puppeteer = (await loadPuppeteer()).default;
  const browser = await puppeteer.launch({
    executablePath: EDGE,
    headless: true,
    args: [
      "--hide-scrollbars",
      "--use-gl=angle",
      "--enable-webgl",
      "--ignore-gpu-blocklist",
      "--disable-web-security",
    ],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: SIZE, height: SIZE, deviceScaleFactor: 1 });
    await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: "networkidle0", timeout: 60000 });
    await page.waitForFunction(
      () => window.__ready === true || Boolean(window.__error),
      { timeout: 60000 }
    );
    const bootError = await page.evaluate(() => window.__error);
    if (bootError) throw new Error(`GLB no cargó: ${bootError}`);

    for (let i = 0; i < FRAMES; i += 1) {
      const dataUrl = await page.evaluate(
        (index, total) => {
          window.__setFrame(index, total);
          return document.getElementById("view").toDataURL("image/png");
        },
        i,
        FRAMES
      );
      const buf = Buffer.from(dataUrl.split(",")[1], "base64");
      const framePath = path.join(tmp, `frame_${String(i).padStart(3, "0")}.png`);
      fs.writeFileSync(framePath, buf);
      if (i === 0) fs.writeFileSync(outPng, buf);
    }
  } finally {
    await browser.close();
    server.close();
  }

  const palette = path.join(tmp, "palette.png");
  const pattern = path.join(tmp, "frame_%03d.png");
  execFileSync(
    "ffmpeg",
    ["-y", "-framerate", String(FPS), "-i", pattern, "-vf", "palettegen=stats_mode=full", palette],
    { stdio: "inherit" }
  );
  execFileSync(
    "ffmpeg",
    [
      "-y",
      "-framerate",
      String(FPS),
      "-i",
      pattern,
      "-i",
      palette,
      "-lavfi",
      "paletteuse=dither=bayer:bayer_scale=3:diff_mode=rectangle",
      "-loop",
      "0",
      outGif,
    ],
    { stdio: "inherit" }
  );
  fs.rmSync(tmp, { recursive: true, force: true });
  const stats = fs.statSync(outGif);
  console.log(`GIF ${outGif} (${Math.round(stats.size / 1024)} KB)`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
