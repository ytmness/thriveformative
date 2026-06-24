const PLACEHOLDER_MARKERS = ["TU_PROJECT_REF", "placeholder", "tu_anon_key"];

function isConfigured(value: string | undefined): value is string {
  if (!value?.trim()) return false;
  const lower = value.toLowerCase();
  return !PLACEHOLDER_MARKERS.some((m) => lower.includes(m));
}

export type ClientEnv = {
  supabaseUrl: string;
  supabaseAnonKey: string;
  siteUrl: string | undefined;
};

let cached: ClientEnv | null = null;

export function getClientEnv(): ClientEnv {
  if (cached) return cached;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!isConfigured(supabaseUrl) || !isConfigured(supabaseAnonKey)) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY deben estar definidos. " +
        "Dashboard: https://supabase.com/dashboard/project/_/settings/api"
    );
  }

  cached = {
    supabaseUrl,
    supabaseAnonKey,
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL?.trim() || undefined,
  };
  return cached;
}

export function hasClientEnv(): boolean {
  try {
    getClientEnv();
    return true;
  } catch {
    return false;
  }
}
