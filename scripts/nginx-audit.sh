#!/bin/bash
# Auditoría Nginx — ejecutar en el servidor cuando varias webs comparten el mismo
# Uso: sudo bash scripts/nginx-audit.sh

echo "=== Sitios habilitados en Nginx ==="
ls -la /etc/nginx/sites-enabled/

echo ""
echo "=== Server blocks y server_name (puerto 80) ==="
nginx -T 2>/dev/null | grep -E "listen |server_name " | head -60

echo ""
echo "=== Caché de errores 502/503/504 ==="
if nginx -T 2>/dev/null | grep -q 'thrive_error_cache_control'; then
  echo "OK: Nginx envía Cache-Control no-store en errores de gateway."
else
  echo "FALTA: los navegadores pueden cachear 502/503 durante reinicios de PM2."
  echo "  Aplicar: sudo bash /var/www/thriveformative/scripts/patch-nginx-error-cache.sh"
fi

echo ""
echo "=== Recomendación ==="
echo "Cada dominio debe tener su propio server block con server_name correcto."
echo "Si thriveformative.com muestra otra web, revisa que:"
echo "  1. /etc/nginx/sites-enabled/thriveformative existe"
echo "  2. Ningún otro config tiene server_name que coincida con thriveformative.com"
echo "  3. Tras cambios: nginx -t && systemctl reload nginx"
echo "  4. Usa solo PM2 o solo systemd para thriveformative (no ambos en :3001)"
