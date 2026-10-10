import { randomBytes } from "crypto";
import fs from "fs/promises";
import path from "path";
import { DomainError } from "@/lib/http";

function appRoot() {
  const cwd = process.cwd().replace(/\\/g, "/");
  if (cwd.endsWith("/.next/standalone")) return path.resolve(process.cwd(), "..", "..");
  return process.cwd();
}

function uploadsRoot() {
  return process.env.PRIVATE_UPLOADS_DIR || path.join(appRoot(), "data", "private-uploads");
}

function inside(root: string, abs: string) {
  const base = path.resolve(root);
  const target = path.resolve(abs);
  return target === base || target.startsWith(base + path.sep);
}

function candidatePaths(rel: string) {
  const roots = [uploadsRoot(), path.join(process.cwd(), "data", "private-uploads")];
  return roots
    .map((root) => path.resolve(root, rel))
    .filter((abs, index, all) => all.indexOf(abs) === index && roots.some((root) => inside(root, abs)));
}

export async function savePrivateFile(patientId: string, filename: string, data: Buffer) {
  const safe = filename.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-80) || "archivo";
  const rel = path.posix.join(patientId, `${randomBytes(16).toString("hex")}-${safe}`);
  const abs = path.join(uploadsRoot(), rel);
  await fs.mkdir(path.dirname(abs), { recursive: true });
  await fs.writeFile(abs, data);
  return rel;
}

export async function privateFileExists(rel: string) {
  for (const abs of candidatePaths(rel)) {
    try {
      await fs.access(abs);
      return true;
    } catch {
      /* prueba la siguiente carpeta */
    }
  }
  return false;
}

export async function readPrivateFile(rel: string) {
  for (const abs of candidatePaths(rel)) {
    try {
      return await fs.readFile(abs);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
  }
  throw new DomainError("El archivo ya no está en el servidor. Vuelve a subirlo.", 404);
}

export async function deletePrivateFile(rel: string) {
  for (const abs of candidatePaths(rel)) {
    await fs.unlink(abs).catch((error: NodeJS.ErrnoException) => {
      if (error.code !== "ENOENT") throw error;
    });
  }
}
