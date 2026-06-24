/**
 * Aplica 016_hardening.sql contra la BD remota.
 * Requiere SUPABASE_DB_URL o DATABASE_URL en .env.local (connection string de Supabase → Database).
 * Uso: node scripts/apply-migration-016.mjs
 */
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

function loadEnvFile(path) {
  if (!existsSync(path)) return;
  const text = readFileSync(path, "utf8");
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvFile(join(ROOT, ".env.local"));
loadEnvFile(join(ROOT, ".env"));

const dbUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;

async function main() {
  if (!dbUrl) {
    console.error(
      "Falta SUPABASE_DB_URL o DATABASE_URL en .env.local\n" +
        "Obtén la connection string en Supabase → Project Settings → Database → Connection string (URI)"
    );
    process.exit(1);
  }

  const sql = readFileSync(join(ROOT, "supabase/migrations/016_hardening.sql"), "utf8");
  const client = new pg.Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });

  try {
    await client.connect();
    console.log("==> Conectado. Aplicando 016_hardening.sql...");
    await client.query(sql);
    console.log("==> Migración 016 aplicada correctamente.");

    const { rows } = await client.query(
      "select proname from pg_proc where proname = 'get_taken_slots'"
    );
    console.log("==> Verificación get_taken_slots:", rows.length ? "OK" : "FALTA");
  } finally {
    await client.end().catch(() => {});
  }
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
