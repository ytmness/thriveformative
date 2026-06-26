#!/bin/bash
# Reemplaza la config de Nginx por proxy puro a Node (Next standalone).
# Soluciona 404 masivos en /_next/static/, /logos/, fuentes, etc. cuando
# location + alias no coinciden con las rutas reales tras el build.
#
# Uso en el servidor:
#   sudo bash /var/www/thriveformative/scripts/apply-nginx-proxy-only.sh
#
# Delega en apply-nginx-no-cache-errors.sh (incluye anti-caché en 502/503).
set -e
APP_DIR="${APP_DIR:-/var/www/thriveformative}"
exec bash "$APP_DIR/scripts/apply-nginx-no-cache-errors.sh"
