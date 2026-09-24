const fs = require("fs");
const path = require("path");

/** Load KEY=VALUE pairs from a .env file (no export, no quotes required). */
function loadEnvFile(filePath) {
  const out = {};
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq <= 0) continue;
      const key = trimmed.slice(0, eq).trim();
      let val = trimmed.slice(eq + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      out[key] = val;
    }
  } catch {
    /* missing file is fine */
  }
  return out;
}

const appDir = __dirname;
const rootEnv = {
  ...loadEnvFile(path.join(appDir, ".env")),
  ...loadEnvFile(path.join(appDir, ".env.local")),
};

/** @type {import('pm2').StartOptions} */
module.exports = {
  apps: [
    {
      name: "thriveformative",
      cwd: path.join(appDir, ".next/standalone"),
      script: "server.js",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      max_restarts: 10,
      env: {
        NODE_ENV: "production",
        PORT: 3001,
        DATABASE_URL: rootEnv.DATABASE_URL || "",
        ADMIN_PASSWORD: rootEnv.ADMIN_PASSWORD || "",
        ADMIN_SESSION_SECRET: rootEnv.ADMIN_SESSION_SECRET || "",
        NOTIFY_EMAIL: rootEnv.NOTIFY_EMAIL || "",
        COMING_SOON_PASSWORD: rootEnv.COMING_SOON_PASSWORD || "",
        NEXT_PUBLIC_SITE_URL: rootEnv.NEXT_PUBLIC_SITE_URL || "",
        NEXT_PUBLIC_PABAU_COMPANY_SLUG: rootEnv.NEXT_PUBLIC_PABAU_COMPANY_SLUG || "",
        NEXT_PUBLIC_PABAU_BOOKING_URL: rootEnv.NEXT_PUBLIC_PABAU_BOOKING_URL || "",
        NEXT_PUBLIC_PABAU_BOOKING_SHAPESCALE_URL:
          rootEnv.NEXT_PUBLIC_PABAU_BOOKING_SHAPESCALE_URL || "",
      },
    },
  ],
};
