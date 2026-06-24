import type { CookieOptions } from "@supabase/ssr";

export function applySecureCookieDefaults(options: CookieOptions): CookieOptions {
  return {
    ...options,
    path: options.path ?? "/",
    sameSite: options.sameSite ?? "lax",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  };
}
