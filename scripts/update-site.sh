#!/bin/bash
# Actualizar Thrive Formative en el servidor (cada vez que hagas cambios y push).
# Ejecutar en el servidor: bash update-site.sh
# Desde la carpeta del repo o: bash /var/www/thriveformative/scripts/update-site.sh

set -e
APP_DIR="/var/www/thriveformative"
cd "$APP_DIR"

echo "==> git pull origin main"
git pull origin main

echo "==> npm run build"
npm run build

echo "==> Copiando public y .next/static al standalone..."
cp -r public .next/standalone/
cp -r .next/static .next/standalone/.next/

echo "==> Reiniciando thriveformative..."
systemctl restart thriveformative

echo ""
echo "==> Listo. Prueba https://thriveformative.com (Ctrl+Shift+R para evitar caché)."
