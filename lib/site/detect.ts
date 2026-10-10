import type { NextRequest } from "next/server";
import type { SiteMarket } from "@/lib/site/market";

function isPublicIp(ip: string) {
  if (!ip || ip === "::1" || ip.startsWith("127.") || ip.startsWith("10.") || ip.startsWith("192.168.") || ip.startsWith("169.254.")) {
    return false;
  }
  const match = ip.match(/^172\.(\d+)\./);
  if (match) {
    const block = Number(match[1]);
    if (block >= 16 && block <= 31) return false;
  }
  return true;
}

function clientIp(request: NextRequest) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    for (const part of forwarded.split(",")) {
      const ip = part.trim();
      if (isPublicIp(ip)) return ip;
    }
  }
  const real = request.headers.get("x-real-ip")?.trim() || "";
  return isPublicIp(real) ? real : null;
}

function marketFromCode(code: string | null | undefined): SiteMarket | null {
  const value = (code || "").trim().toUpperCase();
  if (!value || value === "XX" || value === "T1") return null;
  return value === "US" ? "US" : "MX";
}

export async function detectVisitorMarket(request: NextRequest): Promise<SiteMarket> {
  const fromHeader = marketFromCode(
    request.headers.get("cf-ipcountry") || request.headers.get("x-country-code")
  );
  if (fromHeader) return fromHeader;

  const ip = clientIp(request);
  if (!ip) return "MX";
  try {
    const res = await fetch(`https://ipwho.is/${encodeURIComponent(ip)}`, {
      signal: AbortSignal.timeout(1500),
      headers: { accept: "application/json" },
    });
    if (!res.ok) return "MX";
    const data = (await res.json()) as { success?: boolean; country_code?: string };
    if (data.success === false) return "MX";
    return data.country_code?.toUpperCase() === "US" ? "US" : "MX";
  } catch {
    return "MX";
  }
}
