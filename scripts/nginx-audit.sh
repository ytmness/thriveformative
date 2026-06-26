#!/bin/bash
# Auditoría Nginx — ejecutar en el servidor cuando varias webs comparten el mismo
# Uso: sudo bash scripts/nginx-audit.sh

echo "=== Sitios habilitados en Nginx ==="
ls -la /etc/nginx/sites-enabled/

echo ""
echo "=== Server blocks y server_name (puerto 80) ==="
nginx -T 2>/dev/null | grep -E "listen |server_name " | head -60

echo ""
echo "=== Recomendación ==="
echo "Cada dominio debe tener su propio server block con server_name correcto."
echo "Si thriveformative.com muestra otra web, revisa que:"
echo "  1. /etc/nginx/sites-enabled/thriveformative existe"
echo "  2. Ningún otro config tiene server_name que coincida con thriveformative.com"
echo "  3. Tras cambios: nginx -t && systemctl reload nginx"
echo ""
echo "Si el navegador guarda errores 502/503 tras un deploy:"
echo "  sudo bash /var/www/thriveformative/scripts/apply-nginx-no-cache-errors.sh"
