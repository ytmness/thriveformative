#!/bin/bash
# Despliegue Thrive Formative con PM2 (runbook deploy_next_pm2).
# Ejecutar en el servidor:
#   bash /var/www/thriveformative/scripts/deploy-next-pm2.sh

set -e

APP_DIR="${APP_DIR:-/var/www/thriveformative}"
PM2_APP="${PM2_APP:-thriveformative}"
PORT="${PORT:-3001}"

cd "$APP_DIR"

echo "==> Check git status"
git status --short --branch

echo "==> Pull latest changes (fetch + reset)"
bash "$APP_DIR/scripts/git-sync-main.sh"

echo "==> npm install"
npm install

echo "==> npm run build"
npm run build

# Evitar conflicto PM2 + systemd en el mismo puerto (causa 502/503 intermitentes).
if systemctl is-enabled thriveformative >/dev/null 2>&1; then
  echo "==> Deshabilitando servicio systemd duplicado (PM2 es el gestor activo)..."
  systemctl stop thriveformative || true
  systemctl disable thriveformative || true
fi

echo "==> PM2 restart $PM2_APP"
if pm2 describe "$PM2_APP" >/dev/null 2>&1; then
  pm2 restart "$PM2_APP" --update-env
else
  pm2 start "$APP_DIR/ecosystem.config.cjs"
fi

pm2 save

echo "==> Esperando arranque en :$PORT..."
for i in 1 2 3 4 5 6 7 8 9 10; do
  if curl -sf "http://127.0.0.1:$PORT/api/health" >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

echo "==> Verificando estáticos en standalone (tras reinicio)..."
if [ -f "$APP_DIR/scripts/verify-standalone-assets.sh" ]; then
  bash "$APP_DIR/scripts/verify-standalone-assets.sh"
fi

health_code=$(curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:$PORT/api/health")
home_code=$(curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:$PORT/")
echo "==> Health: HTTP $health_code | Home: HTTP $home_code"
if [ "$health_code" != "200" ] || [ "$home_code" != "200" ]; then
  echo "ERROR: la app no responde correctamente tras el deploy."
  pm2 logs "$PM2_APP" --lines 30 --nostream || true
  exit 1
fi

echo ""
echo "==> Deploy completado."
pm2 status "$PM2_APP"
echo "    Prueba https://thriveformative.com con Ctrl+Shift+R (recarga forzada)."
