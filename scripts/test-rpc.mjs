/**
 * Verifica que get_taken_slots existe y responde.
 * Uso: node --env-file=.env.local scripts/test-rpc.mjs
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error("Faltan NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY");
  process.exit(1);
}

const supabase = createClient(url, key);
const today = new Date().toISOString().slice(0, 10);

const { data, error } = await supabase.rpc("get_taken_slots", { p_date: today });

if (error) {
  console.error("RPC falló:", error.code, error.message);
  process.exit(1);
}

console.log("OK get_taken_slots →", data);
