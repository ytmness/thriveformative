import { createHmac, timingSafeEqual } from "crypto";

function decodeSecret(secret: string) {
  const raw = secret.replace(/^whsec_/, "").trim();
  try {
    const buf = Buffer.from(raw, "base64");
    if (buf.length > 0) return buf;
  } catch {
    /* use utf8 fallback */
  }
  return Buffer.from(secret, "utf8");
}

export function verifyGranolaSignature(rawBody: string, headers: Headers, secret: string) {
  const id = headers.get("webhook-id") || "";
  const timestamp = headers.get("webhook-timestamp") || "";
  const signatureHeader = headers.get("webhook-signature") || "";
  if (!id || !timestamp || !signatureHeader) return false;
  const age = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (!Number.isFinite(age) || age > 60 * 5) return false;
  const expected = createHmac("sha256", decodeSecret(secret))
    .update(`${id}.${timestamp}.${rawBody}`)
    .digest("base64");
  const expectedBuf = Buffer.from(`v1,${expected}`);
  return signatureHeader.split(" ").some((part) => {
    const candidate = Buffer.from(part.trim());
    return candidate.length === expectedBuf.length && timingSafeEqual(candidate, expectedBuf);
  });
}
