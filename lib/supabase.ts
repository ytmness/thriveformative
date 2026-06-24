import { createBrowserClient } from "@supabase/ssr";
import { getClientEnv, hasClientEnv } from "@/lib/env/client";

if (typeof window !== "undefined" && !hasClientEnv()) {
  console.warn(
    "[Supabase] Falta configurar .env.local con NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY. " +
      "Sin ellos verás «No API key found in request». Obtén los valores en: https://supabase.com/dashboard/project/_/settings/api"
  );
}

/**
 * Cliente Supabase para uso en componentes de cliente (browser).
 */
export function createClient() {
  const { supabaseUrl, supabaseAnonKey } = getClientEnv();
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
