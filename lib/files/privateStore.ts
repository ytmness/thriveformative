import { randomBytes } from "crypto";
import fs from "fs/promises";
import path from "path";

const root = path.join(process.cwd(), "data", "private-uploads");

export async function savePrivateFile(patientId: string, filename: string, data: Buffer) {
  const safe = filename.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-80) || "archivo";
  const rel = path.posix.join(patientId, `${randomBytes(16).toString("hex")}-${safe}`);
  const abs = path.join(root, rel);
  await fs.mkdir(path.dirname(abs), { recursive: true });
  await fs.writeFile(abs, data);
  return rel;
}

export async function readPrivateFile(rel: string) {
  const abs = path.resolve(root, rel);
  if (!abs.startsWith(path.resolve(root))) {
    throw new Error("Ruta no permitida");
  }
  return fs.readFile(abs);
}
