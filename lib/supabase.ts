import { createBrowserClient } from "@supabase/ssr";

/**
 * Cliente Supabase para uso en componentes de cliente (browser).
 * Usa la anon key; las políticas RLS se aplican.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
