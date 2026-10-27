import { execFileSync } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const source = path.join(root, "public", "logos", "Black-Gradient-Logo-02.png");
const outGif = path.join(root, "public", "emails", "sender-avatar.gif");
const outPng = path.join(root, "public", "emails", "sender-avatar.png");

const SIZE = 512;
const MARK = 360;
const FRAMES = 48;
const GOLD = { r: 212, g: 196, b: 168 };
const BG = { r: 20, g: 17, b: 14 };

async function goldMark() {
  const { data, info } = await sharp(source)
    .resize(MARK, MARK, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  for (let i = 0; i < data.length; i += 4) {
    const alpha = data[i + 3];
    if (alpha < 10) {
      data[i] = 0;
      data[i + 1] = 0;
      data[i + 2] = 0;
      data[i + 3] = 0;
      continue;
    }
    const lum = (data[i] + data[i + 1] + data[i + 2]) / 765;
    const light = 0.55 + lum * 0.45;
    data[i] = Math.min(255, Math.round(GOLD.r * light));
    data[i + 1] = Math.min(255, Math.round(GOLD.g * light));
    data[i + 2] = Math.min(255, Math.round(GOLD.b * light));
  }

  return sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } }).png().toBuffer();
}

async function main() {
  if (!fs.existsSync(source)) {
    throw new Error(`No está el logo: ${source}`);
  }
  const mark = await goldMark();
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "thrive-avatar-"));
  const still = await sharp({
    create: { width: SIZE, height: SIZE, channels: 3, background: BG },
  })
    .composite([{ input: mark, gravity: "center" }])
    .png()
    .toBuffer();
  await fs.promises.writeFile(outPng, still);

  for (let i = 0; i < FRAMES; i += 1) {
    const angle = (360 / FRAMES) * i;
    const rotated = await sharp(mark)
      .rotate(angle, { background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();
    await sharp({
      create: { width: SIZE, height: SIZE, channels: 3, background: BG },
    })
      .composite([{ input: rotated, gravity: "center" }])
      .png()
      .toFile(path.join(tmp, `frame_${String(i).padStart(3, "0")}.png`));
  }

  const palette = path.join(tmp, "palette.png");
  const pattern = path.join(tmp, "frame_%03d.png");
  execFileSync(
    "ffmpeg",
    ["-y", "-framerate", "16", "-i", pattern, "-vf", "palettegen=stats_mode=diff", palette],
    { stdio: "inherit" }
  );
  execFileSync(
    "ffmpeg",
    [
      "-y",
      "-framerate",
      "16",
      "-i",
      pattern,
      "-i",
      palette,
      "-lavfi",
      "paletteuse=dither=bayer:bayer_scale=4:diff_mode=rectangle",
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
