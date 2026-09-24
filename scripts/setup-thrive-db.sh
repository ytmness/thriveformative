#!/bin/bash
# Crea DB + rol thrive_app en el Postgres Docker (mismo patrón que Somnus).
# Uso (en el server):
#   bash /var/www/thriveformative/scripts/setup-thrive-db.sh
#
# Variables opcionales:
#   PG_CONTAINER=somnus-pg
#   THRIVE_DB=thriveformative
#   THRIVE_USER=thrive_app
#   THRIVE_PASS=... (si no, se genera)

set -euo pipefail

PG_CONTAINER="${PG_CONTAINER:-somnus-pg}"
THRIVE_DB="${THRIVE_DB:-thriveformative}"
THRIVE_USER="${THRIVE_USER:-thrive_app}"
THRIVE_PASS="${THRIVE_PASS:-$(openssl rand -hex 24)}"
APP_DIR="${APP_DIR:-/var/www/thriveformative}"
SCHEMA="${SCHEMA:-$APP_DIR/db/schema.sql}"

if ! docker ps --format '{{.Names}}' | grep -qx "$PG_CONTAINER"; then
  echo "ERROR: contenedor $PG_CONTAINER no está corriendo."
  exit 1
fi

# Superuser del contenedor Somnus
SUPER_USER="${SUPER_USER:-somnus_app}"

echo "==> Creando rol/DB si no existen…"
docker exec -i "$PG_CONTAINER" psql -U "$SUPER_USER" -d postgres <<SQL
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '${THRIVE_USER}') THEN
    CREATE ROLE ${THRIVE_USER} LOGIN PASSWORD '${THRIVE_PASS}';
  ELSE
    ALTER ROLE ${THRIVE_USER} WITH LOGIN PASSWORD '${THRIVE_PASS}';
  END IF;
END
\$\$;

SELECT 'CREATE DATABASE ${THRIVE_DB} OWNER ${THRIVE_USER}'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '${THRIVE_DB}')\gexec

GRANT ALL PRIVILEGES ON DATABASE ${THRIVE_DB} TO ${THRIVE_USER};
SQL

echo "==> Aplicando schema…"
docker exec -i "$PG_CONTAINER" psql -U "$SUPER_USER" -d "$THRIVE_DB" < "$SCHEMA"
docker exec -i "$PG_CONTAINER" psql -U "$SUPER_USER" -d "$THRIVE_DB" <<SQL
GRANT ALL ON ALL TABLES IN SCHEMA public TO ${THRIVE_USER};
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO ${THRIVE_USER};
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO ${THRIVE_USER};
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO ${THRIVE_USER};
SQL

ENV_FILE="${ENV_FILE:-$APP_DIR/.env}"
DATABASE_URL="postgresql://${THRIVE_USER}:${THRIVE_PASS}@127.0.0.1:5432/${THRIVE_DB}"

echo "==> Escribiendo DATABASE_URL en $ENV_FILE"
touch "$ENV_FILE"
if grep -q '^DATABASE_URL=' "$ENV_FILE" 2>/dev/null; then
  sed -i "s|^DATABASE_URL=.*|DATABASE_URL=${DATABASE_URL}|" "$ENV_FILE"
else
  printf '\n# Postgres local (mismo host que Somnus)\nDATABASE_URL=%s\n' "$DATABASE_URL" >> "$ENV_FILE"
fi

if ! grep -q '^ADMIN_PASSWORD=' "$ENV_FILE" 2>/dev/null; then
  ADMIN_PASS="$(openssl rand -hex 12)"
  printf 'ADMIN_PASSWORD=%s\n' "$ADMIN_PASS" >> "$ENV_FILE"
  echo "==> ADMIN_PASSWORD generado (guárdalo): $ADMIN_PASS"
fi

if ! grep -q '^ADMIN_SESSION_SECRET=' "$ENV_FILE" 2>/dev/null; then
  printf 'ADMIN_SESSION_SECRET=%s\n' "$(openssl rand -hex 32)" >> "$ENV_FILE"
fi

echo ""
echo "==> Listo."
echo "DATABASE_URL=postgresql://${THRIVE_USER}:***@127.0.0.1:5432/${THRIVE_DB}"
echo "Reinicia la app: pm2 restart thriveformative --update-env"
