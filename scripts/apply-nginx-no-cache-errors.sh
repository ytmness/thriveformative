#!/bin/bash
# Parchea la config Nginx de thriveformative para que 502/503 no se cacheen en el navegador.
# Preserva certificados SSL de Certbot si ya existen.
#
# Uso en el servidor:
#   sudo bash /var/www/thriveformative/scripts/apply-nginx-no-cache-errors.sh
#
set -e

DOMAIN="${DOMAIN:-thriveformative.com}"
APP_DIR="${APP_DIR:-/var/www/thriveformative}"
PORT="${PORT:-3001}"
NGINX_CONF="/etc/nginx/sites-available/thriveformative"
SNIPPET_SRC="$APP_DIR/scripts/nginx/snippets/thriveformative-proxy-error.conf"
SNIPPET_DST="/etc/nginx/snippets/thriveformative-proxy-error.conf"
BACKUP="${NGINX_CONF}.bak.$(date +%Y%m%d%H%M%S)"

if [ "$(id -u)" -ne 0 ]; then
  echo "ERROR: ejecuta con sudo o como root."
  exit 1
fi

if [ ! -f "$SNIPPET_SRC" ]; then
  echo "ERROR: falta $SNIPPET_SRC — haz git pull en $APP_DIR."
  exit 1
fi

mkdir -p /etc/nginx/snippets
cp "$SNIPPET_SRC" "$SNIPPET_DST"

# Extraer rutas SSL del config actual (Certbot) si existen
SSL_CERT=""
SSL_KEY=""
SSL_OPTS=""
if [ -f "$NGINX_CONF" ]; then
  SSL_CERT=$(grep -m1 '^\s*ssl_certificate\s' "$NGINX_CONF" | awk '{print $2}' | tr -d ';' || true)
  SSL_KEY=$(grep -m1 '^\s*ssl_certificate_key\s' "$NGINX_CONF" | awk '{print $2}' | tr -d ';' || true)
  if [ -n "$SSL_CERT" ] && [ -f "$SSL_CERT" ] && [ -n "$SSL_KEY" ] && [ -f "$SSL_KEY" ]; then
    SSL_OPTS=$(awk '/listen 443 ssl/,/^}/ { if (/ssl_/) print }' "$NGINX_CONF" | grep -v '^\s*#' | sort -u || true)
    echo "==> SSL detectado (Certbot): $SSL_CERT"
  else
    SSL_CERT=""
    SSL_KEY=""
    SSL_OPTS=""
  fi
fi

if [ -f "$NGINX_CONF" ]; then
  cp -a "$NGINX_CONF" "$BACKUP"
  echo "==> Copia de seguridad: $BACKUP"
fi

write_proxy_location() {
  cat << EOF
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
        proxy_connect_timeout 10s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        proxy_intercept_errors on;
        error_page 502 503 504 = @thrive_proxy_error;
    }

    include $SNIPPET_DST;
EOF
}

{
  echo "# Thrive Formative — proxy a Node con errores no cacheables"
  echo "# Generado por apply-nginx-no-cache-errors.sh"
  echo "server {"
  echo "    listen 80;"
  echo "    listen [::]:80;"
  echo "    server_name $DOMAIN www.$DOMAIN;"
  write_proxy_location
  echo "}"

  if [ -n "$SSL_CERT" ]; then
    echo ""
    echo "server {"
    echo "    listen 443 ssl http2;"
    echo "    listen [::]:443 ssl http2;"
    echo "    server_name $DOMAIN www.$DOMAIN;"
    if [ -n "$SSL_OPTS" ]; then
      echo "$SSL_OPTS"
    else
      echo "    ssl_certificate $SSL_CERT;"
      echo "    ssl_certificate_key $SSL_KEY;"
      echo "    include /etc/letsencrypt/options-ssl-nginx.conf;"
      echo "    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;"
    fi
    write_proxy_location
    echo "}"
  fi
} > "$NGINX_CONF"

ln -sf "$NGINX_CONF" /etc/nginx/sites-enabled/thriveformative
nginx -t
systemctl reload nginx

echo "==> Nginx actualizado: errores 502/503/504 con Cache-Control: no-store."
echo "    Tras un deploy, el navegador ya no debería guardar la página de error."
