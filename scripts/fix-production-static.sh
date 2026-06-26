#!/bin/bash
# Reparación rápida en el servidor cuando /logos/* o /_next/static/* devuelven 404.
# Uso: sudo bash /var/www/thriveformative/scripts/fix-production-static.sh
#
set -e
APP_DIR="${APP_DIR:-/var/www/thriveformative}"
cd "$APP_DIR"

echo "==> Copiando estáticos al standalone (public + .next/static)..."
node scripts/copy-standalone-assets.js

echo "==> Reiniciando servicio..."
if command -v pm2 >/dev/null 2>&1 && pm2 describe thriveformative >/dev/null 2>&1; then
  pm2 restart thriveformative --update-env
  pm2 save
elif systemctl is-active --quiet thriveformative 2>/dev/null; then
  systemctl restart thriveformative
else
  echo "WARN: no se encontró PM2 ni systemd thriveformative; reinicia la app manualmente."
fi

echo "==> Verificando..."
bash scripts/verify-standalone-assets.sh

echo ""
echo "==> Reparado. Recarga https://thriveformative.com con Ctrl+Shift+R."
echo "    Si sigue en 404 por HTTPS, ejecuta también:"
echo "    sudo bash $APP_DIR/scripts/apply-nginx-proxy-only.sh"
