import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getClientEnv } from "@/lib/env/client";
import { applySecureCookieDefaults } from "@/lib/supabase/cookies";

export async function createClient() {
  const cookieStore = await cookies();
  const { supabaseUrl, supabaseAnonKey } = getClientEnv();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, applySecureCookieDefaults(options))
          );
        } catch {
          // En Server Components setAll puede fallar; el middleware refresca la sesión.
        }
      },
    },
  });
}
