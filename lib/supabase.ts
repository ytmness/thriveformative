import { createBrowserClient } from "@supabase/ssr";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const hasValidEnv = url && key && !url.includes("TU_PROJECT_REF") && !key.includes("placeholder");

if (typeof window !== "undefined" && !hasValidEnv) {
  console.warn(
    "[Supabase] Falta configurar .env.local con NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY. " +
    "Sin ellos verás «No API key found in request». Obtén los valores en: https://supabase.com/dashboard/project/_/settings/api"
  );
}

/**
 * Cliente Supabase para uso en componentes de cliente (browser).
 * Requiere NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY en .env.local (o en el host en producción).
 */
export function createClient() {
  if (!hasValidEnv) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY deben estar definidos en .env.local (o en variables de entorno en producción). " +
      "Dashboard: https://supabase.com/dashboard/project/_/settings/api"
    );
  }
  return createBrowserClient(url!, key!);
}
