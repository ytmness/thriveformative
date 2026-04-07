#!/bin/bash
# Comprueba que el modo standalone tenga CSS/JS/fuentes y public/ copiados.
# Si falla, vuelve a ejecutar build + copias (ver deploy-ubuntu.sh).
#
#   sudo bash scripts/verify-standalone-assets.sh
#
set -e
APP_DIR="${APP_DIR:-/var/www/thriveformative}"
STAND="$APP_DIR/.next/standalone"
PORT="${PORT:-3001}"

echo "==> Ruta standalone: $STAND"
if [ ! -f "$STAND/server.js" ]; then
  echo "ERROR: Falta $STAND/server.js — ejecuta npm run build en $APP_DIR"
  exit 1
fi

echo "==> Chunks JS:"
find "$STAND/.next/static/chunks" -name "*.js" 2>/dev/null | wc -l | xargs echo "    archivos:"
echo "==> Media (fuentes, etc.):"
find "$STAND/.next/static/media" -type f 2>/dev/null | wc -l | xargs echo "    archivos:"
echo "==> public/logos:"
ls "$STAND/public/logos" 2>/dev/null | wc -l | xargs echo "    archivos:"

CHUNK=$(find "$STAND/.next/static/chunks" -name "webpack-*.js" 2>/dev/null | head -1)
if [ -z "$CHUNK" ]; then
  echo "ERROR: No hay webpack-*.js en .next/static/chunks — build o copia incompleta."
  exit 1
fi
REL="/_next/static/chunks/$(basename "$CHUNK")"
echo "==> Probando Node en :$PORT con: $REL"
code=$(curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:$PORT$REL")
echo "    HTTP $code (esperado 200)"
if [ "$code" != "200" ]; then
  echo "    Repara con: cd $APP_DIR && npm run build && mkdir -p .next/standalone/.next && rm -rf .next/standalone/.next/static && cp -r .next/static .next/standalone/.next/ && rm -rf .next/standalone/public && cp -r public .next/standalone/ && systemctl restart thriveformative"
  exit 1
fi

LOGO=$(ls "$STAND/public/logos"/*.png 2>/dev/null | head -1)
if [ -n "$LOGO" ]; then
  LREL="/logos/$(basename "$LOGO")"
  code2=$(curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:$PORT$LREL")
  echo "==> Probando public: $LREL → HTTP $code2"
fi

echo "==> OK: estáticos visibles para Node."
echo "    Si HTTPS sigue en 404 pero aquí sale 200, revisa Nginx :443 (debe ser proxy_pass a :$PORT, sin try_files/root)."
