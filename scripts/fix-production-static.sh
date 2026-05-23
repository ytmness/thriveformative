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
systemctl restart thriveformative

echo "==> Verificando..."
bash scripts/verify-standalone-assets.sh

echo ""
echo "==> Reparado. Recarga https://thriveformative.com con Ctrl+Shift+R."
echo "    Si sigue en 404 por HTTPS, ejecuta también:"
echo "    sudo bash $APP_DIR/scripts/apply-nginx-proxy-only.sh"
