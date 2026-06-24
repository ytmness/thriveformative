import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { getClientEnv } from "@/lib/env/client";
import { applySecureCookieDefaults } from "@/lib/supabase/cookies";
import { routing } from "./i18n/routing";

const handleI18nRouting = createIntlMiddleware(routing);

export async function middleware(request: NextRequest) {
  const response = handleI18nRouting(request);

  try {
    const { supabaseUrl, supabaseAnonKey } = getClientEnv();
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, applySecureCookieDefaults(options));
          });
        },
      },
    });

    await supabase.auth.getUser();
  } catch {
    // Si faltan env en build/preview, no bloquear el routing i18n.
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!api|auth|_next|_vercel|.*\\..*).*)",
  ],
};
