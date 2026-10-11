import type { NextRequest } from "next/server";
import type { SiteMarket } from "@/lib/site/market";

type WithHeaders = { headers: { get(name: string): string | null } };

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

function clientIp(request: WithHeaders) {
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

export async function visitorMarket(request: WithHeaders): Promise<SiteMarket | null> {
  const headerCode = request.headers.get("cf-ipcountry") || request.headers.get("x-country-code");
  const fromHeader = marketFromCode(headerCode);
  if (fromHeader) return fromHeader;

  const ip = clientIp(request);
  if (!ip) return null;
  try {
    const res = await fetch(`https://ipwho.is/${encodeURIComponent(ip)}`, {
      signal: AbortSignal.timeout(1500),
      headers: { accept: "application/json" },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { success?: boolean; country_code?: string };
    if (data.success === false) return null;
    return data.country_code?.toUpperCase() === "US" ? "US" : "MX";
  } catch {
    return null;
  }
}

export async function detectVisitorMarket(request: NextRequest): Promise<SiteMarket> {
  return (await visitorMarket(request)) ?? "MX";
}
