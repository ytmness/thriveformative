#!/bin/bash
# Reemplaza la config de Nginx por proxy puro a Node (Next standalone).
# Soluciona 404 masivos en /_next/static/, /logos/, fuentes, etc. cuando
# location + alias no coinciden con las rutas reales tras el build.
#
# Uso en el servidor:
#   sudo bash /var/www/thriveformative/scripts/apply-nginx-proxy-only.sh
#
set -e
DOMAIN="${DOMAIN:-thriveformative.com}"
APP_DIR="${APP_DIR:-/var/www/thriveformative}"
PORT="${PORT:-3001}"
NGINX_CONF="/etc/nginx/sites-available/thriveformative"
BACKUP="${NGINX_CONF}.bak.$(date +%Y%m%d%H%M%S)"

if [ ! -f "$APP_DIR/.next/standalone/server.js" ]; then
  echo "ERROR: No existe $APP_DIR/.next/standalone/server.js — despliega con build antes."
  exit 1
fi

if [ -f "$NGINX_CONF" ]; then
  cp -a "$NGINX_CONF" "$BACKUP"
  echo "==> Copia de seguridad: $BACKUP"
fi

cat > "$NGINX_CONF" << EOF
# Thrive Formative — todo el tráfico al proceso Node (sirve /_next/static y /public)
# Generado por apply-nginx-proxy-only.sh
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN www.$DOMAIN;

    location / {
        proxy_pass http://127.0.0.1:$PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

ln -sf "$NGINX_CONF" /etc/nginx/sites-enabled/thriveformative
nginx -t
systemctl reload nginx
echo "==> Nginx actualizado: solo proxy a :$PORT (sin alias de estáticos)."
echo "    Si usas HTTPS con Certbot, añade un server { listen 443 ssl; ... } con el mismo bloque location / { proxy_pass ... }"
echo "    o vuelve a ejecutar: sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN"
