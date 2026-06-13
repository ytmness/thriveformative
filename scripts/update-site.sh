#!/bin/bash
# Actualizar Thrive Formative en el servidor (cada vez que hagas cambios y push).
# Ejecutar en el servidor: bash /var/www/thriveformative/scripts/update-site.sh

set -e
APP_DIR="/var/www/thriveformative"
cd "$APP_DIR"

echo "==> Sincronizar con origin/main"
bash "$APP_DIR/scripts/git-sync-main.sh"

echo "==> npm run build (incluye postbuild: copia public + static al standalone)"
npm run build

echo "==> Verificando estáticos en standalone..."
bash scripts/verify-standalone-assets.sh

echo "==> Reiniciando thriveformative..."
if command -v pm2 >/dev/null 2>&1 && pm2 describe thriveformative >/dev/null 2>&1; then
  pm2 restart thriveformative --update-env
  pm2 save
elif systemctl is-active --quiet thriveformative 2>/dev/null; then
  systemctl restart thriveformative
else
  echo "WARN: no se encontró PM2 ni systemd thriveformative; reinicia la app manualmente."
fi

echo ""
echo "==> Listo. Prueba https://thriveformative.com (Ctrl+Shift+R para evitar caché)."
