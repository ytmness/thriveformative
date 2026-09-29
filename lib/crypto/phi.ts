import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes } from "crypto";
import { log } from "@/lib/log";

let warnedFallback = false;

function getKey(): Buffer {
  const raw = process.env.PHI_ENCRYPTION_KEY?.trim();
  if (raw) {
    const buf = Buffer.from(raw, "base64");
    if (buf.length !== 32) {
      throw new Error("PHI_ENCRYPTION_KEY debe ser 32 bytes en base64.");
    }
    return buf;
  }
  const fallback = process.env.ADMIN_SESSION_SECRET?.trim() || process.env.ADMIN_PASSWORD?.trim();
  if (!fallback) {
    throw new Error("Define PHI_ENCRYPTION_KEY.");
  }
  if (!warnedFallback) {
    warnedFallback = true;
    log.warn("phi", "PHI_ENCRYPTION_KEY no está definida; se deriva una clave de respaldo.");
  }
  return createHash("sha256").update(`thrive-phi:${fallback}`).digest();
}

export function encryptPhi(value: string | null | undefined): Buffer | null {
  if (value == null || value === "") return null;
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getKey(), iv);
  const enc = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([Buffer.from([1]), iv, tag, enc]);
}

export function decryptPhi(data: Buffer | Uint8Array | string | null | undefined): string | null {
  if (data == null) return null;
  const buf = Buffer.isBuffer(data) ? data : Buffer.from(data);
  if (buf.length < 1 + 12 + 16) return null;
  try {
    const iv = buf.subarray(1, 13);
    const tag = buf.subarray(13, 29);
    const enc = buf.subarray(29);
    const decipher = createDecipheriv("aes-256-gcm", getKey(), iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(enc), decipher.final()]).toString("utf8");
  } catch {
    return null;
  }
}

export function normalizeEmail(value: string | null | undefined): string | null {
  const v = value?.trim().toLowerCase() ?? "";
  return v || null;
}

export function normalizePhone(value: string | null | undefined): string | null {
  const digits = (value ?? "").replace(/\D/g, "");
  return digits || null;
}

export function contactHash(kind: "email" | "phone", value: string | null | undefined): Buffer | null {
  const norm = kind === "email" ? normalizeEmail(value) : normalizePhone(value);
  if (!norm) return null;
  return createHmac("sha256", getKey()).update(`${kind}:${norm}`).digest();
}
