#!/bin/bash
# Despliegue Thrive Formative con PM2 (runbook deploy_next_pm2).
# Ejecutar en el servidor:
#   bash /var/www/thriveformative/scripts/deploy-next-pm2.sh

set -e

APP_DIR="${APP_DIR:-/var/www/thriveformative}"
PM2_APP="${PM2_APP:-thriveformative}"

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

echo "==> Verificando estáticos en standalone (tras restart)..."
if [ -f "$APP_DIR/scripts/verify-standalone-assets.sh" ]; then
  bash "$APP_DIR/scripts/verify-standalone-assets.sh" || true
fi

echo ""
echo "==> Deploy completado."
pm2 status "$PM2_APP"
