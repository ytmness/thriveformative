#!/bin/bash
# Reemplaza la config de Nginx por proxy puro a Node (Next standalone).
# Soluciona 404 masivos en /_next/static/, /logos/, fuentes, etc. cuando
# location + alias no coinciden con las rutas reales tras el build.
# Incluye cabeceras para que 502/503/504 no se guarden en caché del navegador.
#
# Uso en el servidor:
#   sudo bash /var/www/thriveformative/scripts/apply-nginx-proxy-only.sh
#
# Si ya tienes Certbot y solo quieres el parche de caché de errores:
#   sudo bash /var/www/thriveformative/scripts/patch-nginx-error-cache.sh
#
set -e
DOMAIN="${DOMAIN:-thriveformative.com}"
APP_DIR="${APP_DIR:-/var/www/thriveformative}"
PORT="${PORT:-3001}"
NGINX_CONF="/etc/nginx/sites-available/thriveformative"
BACKUP="${NGINX_CONF}.bak.$(date +%Y%m%d%H%M%S)"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROXY_SNIPPET="$SCRIPT_DIR/lib/nginx-proxy-location.conf"

if [ ! -f "$APP_DIR/.next/standalone/server.js" ]; then
  echo "ERROR: No existe $APP_DIR/.next/standalone/server.js — despliega con build antes."
  exit 1
fi

if [ ! -f "$PROXY_SNIPPET" ]; then
  echo "ERROR: Falta $PROXY_SNIPPET"
  exit 1
fi

if [ -f "$NGINX_CONF" ]; then
  cp -a "$NGINX_CONF" "$BACKUP"
  echo "==> Copia de seguridad: $BACKUP"
fi

PROXY_LOCATION="$(sed "s/__PORT__/$PORT/g" "$PROXY_SNIPPET")"

SSL_CERT="/etc/letsencrypt/live/$DOMAIN/fullchain.pem"
SSL_KEY="/etc/letsencrypt/live/$DOMAIN/privkey.pem"
HAS_SSL=0
if [ -f "$SSL_CERT" ] && [ -f "$SSL_KEY" ]; then
  HAS_SSL=1
  echo "==> Certificados SSL detectados; generando bloques HTTP→HTTPS y :443"
fi

{
  cat << 'EOF'
# Thrive Formative — todo el tráfico al proceso Node (sirve /_next/static y /public)
# Generado por apply-nginx-proxy-only.sh

# No cachear errores de gateway (502/503/504) durante reinicios de PM2
map $status $thrive_error_cache_control {
    ~^50[234]  "no-store, no-cache, must-revalidate, max-age=0";
    default    "";
}

EOF

  if [ "$HAS_SSL" -eq 1 ]; then
    cat << EOF
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN www.$DOMAIN;
    return 301 https://\$host\$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name $DOMAIN www.$DOMAIN;

    ssl_certificate $SSL_CERT;
    ssl_certificate_key $SSL_KEY;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

$PROXY_LOCATION
}
EOF
  else
    cat << EOF
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN www.$DOMAIN;

$PROXY_LOCATION
}
EOF
  fi
} > "$NGINX_CONF"

ln -sf "$NGINX_CONF" /etc/nginx/sites-enabled/thriveformative
nginx -t
systemctl reload nginx
echo "==> Nginx actualizado: proxy a :$PORT (sin alias de estáticos, sin caché de 502/503/504)."
if [ "$HAS_SSL" -eq 0 ]; then
  echo "    Para HTTPS: sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN"
  echo "    Luego vuelve a ejecutar este script para regenerar el bloque :443."
fi
