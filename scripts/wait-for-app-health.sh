#!/bin/bash
# Espera a que la app Next responda en /api/health (útil tras pm2 restart).
#
#   bash scripts/wait-for-app-health.sh
#
set -e
PORT="${PORT:-3001}"
MAX_WAIT="${MAX_WAIT:-60}"
URL="http://127.0.0.1:${PORT}/api/health"

echo "==> Esperando respuesta en $URL (máx ${MAX_WAIT}s)..."
for i in $(seq 1 "$MAX_WAIT"); do
  if curl -sf "$URL" >/dev/null 2>&1; then
    echo "==> App respondiendo en :${PORT} (${i}s)"
    exit 0
  fi
  sleep 1
done

echo "ERROR: la app no respondió en ${MAX_WAIT}s — revisa: pm2 logs thriveformative --lines 50"
exit 1
