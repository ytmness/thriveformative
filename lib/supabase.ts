import { createBrowserClient } from "@supabase/ssr";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (typeof window !== "undefined" && (!url || !key || url.includes("TU_PROJECT_REF"))) {
  console.warn(
    "[Supabase] Falta configurar .env.local con NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY. " +
    "Obtén los valores en: https://supabase.com/dashboard/project/_/settings/api"
  );
}

/**
 * Cliente Supabase para uso en componentes de cliente (browser).
 * Usa la anon key; las políticas RLS se aplican.
 */
export function createClient() {
  const supabaseUrl = url || "https://placeholder.supabase.co";
  const supabaseKey = key || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1wbGFjZWhvbGRlciIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDAwMDAwMDAsImV4cCI6MTk1NTU1NTU1NX0.placeholder";
  return createBrowserClient(supabaseUrl, supabaseKey);
}
