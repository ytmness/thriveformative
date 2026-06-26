#!/bin/bash
# Despliegue Thrive Formative con PM2 (runbook deploy_next_pm2).
# Ejecutar en el servidor:
#   bash /var/www/thriveformative/scripts/deploy-next-pm2.sh

set -e

APP_DIR="${APP_DIR:-/var/www/thriveformative}"
PM2_APP="${PM2_APP:-thriveformative}"
PORT="${PORT:-3001}"
HEALTH_URL="http://127.0.0.1:${PORT}/api/health"

cd "$APP_DIR"

echo "==> Check git status"
git status --short --branch

echo "==> Pull latest changes (fetch + reset)"
bash "$APP_DIR/scripts/git-sync-main.sh"

echo "==> npm install"
npm install

echo "==> npm run build"
npm run build

echo "==> PM2 restart $PM2_APP"
if pm2 describe "$PM2_APP" >/dev/null 2>&1; then
  pm2 restart "$PM2_APP" --update-env
else
  pm2 start "$APP_DIR/ecosystem.config.cjs"
fi

pm2 save

echo "==> Esperando que la app responda en :$PORT..."
ready=0
for i in $(seq 1 45); do
  if curl -sf "$HEALTH_URL" >/dev/null 2>&1; then
    echo "    OK tras ${i}s"
    ready=1
    break
  fi
  sleep 1
done
if [ "$ready" -ne 1 ]; then
  echo "ERROR: la app no respondió en :$PORT tras 45s"
  pm2 logs "$PM2_APP" --lines 30 --nostream || true
  exit 1
fi

echo "==> Verificando estáticos en standalone (tras restart)..."
if [ -f "$APP_DIR/scripts/verify-standalone-assets.sh" ]; then
  bash "$APP_DIR/scripts/verify-standalone-assets.sh"
fi

echo ""
echo "==> Deploy completado."
pm2 status "$PM2_APP"
curl -s "$HEALTH_URL" || true
echo ""
