import bcrypt from "bcryptjs";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import pg from "pg";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

function loadEnv() {
  for (const name of [".env.local", ".env"]) {
    const file = path.join(root, name);
    if (!fs.existsSync(file)) continue;
    for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const i = trimmed.indexOf("=");
      if (i < 0) continue;
      const key = trimmed.slice(0, i).trim();
      let value = trimmed.slice(i + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = value;
    }
  }
}

async function bootstrapAdmin(client) {
  const existing = await client.query("SELECT count(*)::int AS n FROM staff_users");
  if (existing.rows[0].n > 0) return;
  const email = (process.env.ADMIN_EMAIL || "admin@thriveformative.com").trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD?.trim();
  if (!password) {
    console.warn("Sin ADMIN_PASSWORD: no se creó el usuario administrador inicial.");
    return;
  }
  const hash = await bcrypt.hash(password, 12);
  const user = await client.query(
    `INSERT INTO staff_users (email, email_normalized, password_hash, first_name, last_name, job_title, is_bookable)
     VALUES ($1, $1, $2, 'Admin', 'Thrive', 'Administración', true)
     RETURNING id`,
    [email, hash]
  );
  await client.query(
    `INSERT INTO staff_user_roles (staff_user_id, role_id)
     SELECT $1, id FROM roles WHERE key = 'admin'`,
    [user.rows[0].id]
  );
  const location = await client.query("SELECT id FROM locations ORDER BY created_at LIMIT 1");
  const service = await client.query("SELECT id FROM services WHERE name = 'Consulta inicial' LIMIT 1");
  if (location.rows[0] && service.rows[0]) {
    await client.query(
      `INSERT INTO service_staff (service_id, staff_user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [service.rows[0].id, user.rows[0].id]
    );
    await client.query(`UPDATE staff_users SET default_location_id = $2 WHERE id = $1`, [
      user.rows[0].id,
      location.rows[0].id,
    ]);
    for (const day of [1, 2, 3, 4, 5]) {
      await client.query(
        `INSERT INTO staff_schedules (staff_user_id, location_id, day_of_week, start_time, end_time)
         VALUES ($1, $2, $3, '09:00', '17:00')`,
        [user.rows[0].id, location.rows[0].id, day]
      );
    }
  }
  console.log(`Usuario administrador creado: ${email}`);
}

async function main() {
  loadEnv();
  const connectionString = process.env.DATABASE_URL?.trim();
  if (!connectionString) {
    console.error("DATABASE_URL no está definida.");
    process.exit(1);
  }
  const pool = new pg.Pool({ connectionString });
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version text PRIMARY KEY,
        checksum text NOT NULL,
        applied_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    const dir = path.join(root, "db", "migrations");
    const files = fs.readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();
    for (const file of files) {
      const version = file.replace(/\.sql$/, "");
      const sql = fs.readFileSync(path.join(dir, file), "utf8");
      const checksum = crypto.createHash("sha256").update(sql).digest("hex");
      const prev = await client.query("SELECT checksum FROM schema_migrations WHERE version = $1", [
        version,
      ]);
      if (prev.rows[0]) {
        if (prev.rows[0].checksum !== checksum) {
          throw new Error(`${file} cambió después de aplicarse. No se reejecuta.`);
        }
        continue;
      }
      console.log(`Aplicando ${file}`);
      await client.query("BEGIN");
      try {
        await client.query(sql);
        await client.query(
          "INSERT INTO schema_migrations (version, checksum) VALUES ($1, $2)",
          [version, checksum]
        );
        await client.query("COMMIT");
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      }
    }
    await bootstrapAdmin(client);
    console.log("Migraciones al día.");
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
