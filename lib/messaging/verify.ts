import { createHmac, timingSafeEqual, verify as cryptoVerify, createPublicKey } from "crypto";

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

export function verifyTelnyxSignature(rawBody: string, headers: Headers) {
  const signature = headers.get("telnyx-signature-ed25519") || headers.get("Telnyx-Signature-Ed25519") || "";
  const timestamp = headers.get("telnyx-timestamp") || headers.get("Telnyx-Timestamp") || "";
  const publicKey = process.env.TELNYX_PUBLIC_KEY?.trim();
  if (!signature || !timestamp || !publicKey) return false;
  const age = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (!Number.isFinite(age) || age > 60 * 5) return false;
  try {
    // Telnyx public keys are raw 32-byte Ed25519 keys (base64). Wrap as SPKI for Node.
    const rawKey = Buffer.from(publicKey, "base64");
    const spkiPrefix = Buffer.from("302a300506032b6570032100", "hex");
    const key = createPublicKey({
      key: Buffer.concat([spkiPrefix, rawKey]),
      format: "der",
      type: "spki",
    });
    const payload = Buffer.from(`${timestamp}|${rawBody}`);
    return cryptoVerify(null, payload, key, Buffer.from(signature, "base64"));
  } catch {
    return false;
  }
}

export function verifyPlivoSignature(rawBody: string, headers: Headers, url: string) {
  const signature = headers.get("X-Plivo-Signature-V3") || headers.get("x-plivo-signature-v3") || "";
  const nonce = headers.get("X-Plivo-Signature-V3-Nonce") || headers.get("x-plivo-signature-v3-nonce") || "";
  const token = process.env.PLIVO_AUTH_TOKEN?.trim();
  if (!signature || !nonce || !token) return false;
  const base = `${url}${nonce}${rawBody}`;
  const expected = createHmac("sha256", token).update(base).digest("base64");
  return signature.split(",").some((part) => safeEqual(part.trim(), expected));
}

export function verifyMetaSignature(rawBody: string, headers: Headers) {
  const header = headers.get("X-Hub-Signature-256") || headers.get("x-hub-signature-256") || "";
  const secret = process.env.WHATSAPP_APP_SECRET?.trim();
  if (!header.startsWith("sha256=") || !secret) return false;
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  return safeEqual(header.slice("sha256=".length), expected);
}

export function verifyTwilioSignature(rawBody: string, headers: Headers, url: string) {
  const signature = headers.get("X-Twilio-Signature") || headers.get("x-twilio-signature") || "";
  const token = process.env.TWILIO_AUTH_TOKEN?.trim();
  if (!signature || !token) return false;
  // Twilio signs URL + sorted form params. For application/x-www-form-urlencoded bodies:
  const params = new URLSearchParams(rawBody);
  const pairs = Array.from(params.entries()).sort(([a], [b]) => a.localeCompare(b));
  let data = url;
  for (const [key, value] of pairs) data += key + value;
  const expected = createHmac("sha1", token).update(data).digest("base64");
  return safeEqual(signature, expected);
}
