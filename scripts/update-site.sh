#!/bin/bash
# Actualizar Thrive Formative en el servidor (cada vez que hagas cambios y push).
# Ejecutar en el servidor: bash /var/www/thriveformative/scripts/update-site.sh

set -e
APP_DIR="/var/www/thriveformative"
cd "$APP_DIR"

echo "==> git pull origin main"
git pull origin main

echo "==> npm run build (incluye postbuild: copia public + static al standalone)"
npm run build

echo "==> Verificando estáticos en standalone..."
bash scripts/verify-standalone-assets.sh

echo "==> Reiniciando thriveformative..."
systemctl restart thriveformative

echo ""
echo "==> Listo. Prueba https://thriveformative.com (Ctrl+Shift+R para evitar caché)."
