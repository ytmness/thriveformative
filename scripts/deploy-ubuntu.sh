#!/bin/bash
# Script de despliegue Thrive Formative en Ubuntu
# Ejecutar como root o con sudo en el servidor: bash deploy-ubuntu.sh
#
# Si tienes varias webs en el mismo servidor:
#   MULTI_SITE=1 bash deploy-ubuntu.sh  (no elimina default, solo actualiza thriveformative)

set -e
REPO_URL="https://github.com/ytmness/thriveformative.git"
APP_DIR="/var/www/thriveformative"
DOMAIN="thriveformative.com"

echo "==> Instalando dependencias del sistema..."
apt-get update
apt-get install -y curl git

# Node.js 20 LTS (recomendado por Supabase; evita avisos EBADENGINE)
NEED_NODE20=
if ! command -v node &> /dev/null; then
  NEED_NODE20=1
else
  NODE_VER=$(node -v | sed 's/^v//' | cut -d. -f1)
  [ "${NODE_VER:-0}" -lt 20 ] && NEED_NODE20=1
fi
if [ -n "$NEED_NODE20" ]; then
  echo "==> Instalando Node.js 20 LTS..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi

echo "==> Node: $(node -v) | npm: $(npm -v)"

# Crear directorio y clonar/actualizar (reset --hard evita conflictos con package-lock.json u otros cambios locales)
mkdir -p "$(dirname "$APP_DIR")"
if [ -d "$APP_DIR/.git" ]; then
  echo "==> Actualizando repositorio..."
  cd "$APP_DIR"
  git fetch origin
  git reset --hard origin/main
else
  echo "==> Clonando repositorio..."
  git clone "$REPO_URL" "$APP_DIR"
  cd "$APP_DIR"
fi

echo "==> Instalando dependencias y construyendo..."
npm install
npm run build

# Copiar archivos estáticos para standalone (obligatorio o /_next/static y /logos dan 404)
if [ -d ".next/standalone" ]; then
  mkdir -p .next/standalone/.next
  rm -rf .next/standalone/.next/static
  cp -r .next/static .next/standalone/.next/
  rm -rf .next/standalone/public
  cp -r public .next/standalone/
  echo "==> Estáticos copiados a .next/standalone (.next/static + public)"
  if ! find .next/standalone/.next/static/chunks -name "*.js" 2>/dev/null | grep -q .; then
    echo "ERROR: no hay chunks en .next/standalone/.next/static — revisa el build."
    exit 1
  fi
fi

echo "==> Configurando servicio systemd..."
cat > /etc/systemd/system/thriveformative.service << 'SVCEOF'
[Unit]
Description=Thrive Formative Next.js
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/var/www/thriveformative/.next/standalone
ExecStart=/usr/bin/node server.js
Restart=on-failure
RestartSec=5
Environment=NODE_ENV=production
Environment=PORT=3001
# Cargar NOTIFY_EMAIL y SMTP_* desde /var/www/thriveformative/.env (crear ese archivo en el servidor)
EnvironmentFile=-/var/www/thriveformative/.env

[Install]
WantedBy=multi-user.target
SVCEOF

# Si no usas standalone, descomenta y usa:
# ExecStart=/usr/bin/npm start

systemctl daemon-reload
systemctl enable thriveformative
systemctl restart thriveformative

echo "==> Instalando Nginx si no está instalado..."
if ! command -v nginx &> /dev/null; then
  apt-get install -y nginx
fi

echo "==> Configurando Nginx para $DOMAIN..."
STANDALONE="$APP_DIR/.next/standalone"
NGINX_CONF="/etc/nginx/sites-available/thriveformative"
if [ -f "$NGINX_CONF" ]; then
  echo "==> Nginx: config ya existe, no se sobrescribe (se conserva SSL de Certbot)"
  echo "    Si ves 404 en JS/CSS/fuentes o /logos: sudo bash $APP_DIR/scripts/apply-nginx-proxy-only.sh"
else
  # Proxy puro: Next standalone ya sirve /_next/static y archivos de public/.
  # Evita 404 por alias mal alineados (chunks con hash, fuentes .woff2, CSS, /logos/).
  cat > "$NGINX_CONF" << EOF
# Thrive Formative — proxy a Node (standalone)
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN www.$DOMAIN;

    location / {
        proxy_pass http://127.0.0.1:3001;
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
  echo "==> Nginx: config creada (solo proxy). Para HTTPS: sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN"
fi

ln -sf "$NGINX_CONF" /etc/nginx/sites-enabled/thriveformative
if [ -z "$MULTI_SITE" ]; then
  # Una sola web: quitar default para que thriveformative sea la única
  rm -f /etc/nginx/sites-enabled/default 2>/dev/null || true
else
  echo "==> MULTI_SITE: no se toca default (varias webs en el servidor)"
fi
nginx -t && systemctl reload nginx

echo ""
echo "==> Despliegue completado."
echo "    Si al visitar $DOMAIN ves otra web, ejecuta: sudo bash scripts/nginx-audit.sh"
echo "    App: http://127.0.0.1:3001 (proxy Nginx)"
echo "    Nginx escuchando en puerto 80 para $DOMAIN y www.$DOMAIN"
echo ""
echo "Para que lleguen los correos (citas, contacto), crea en el servidor:"
echo "    $APP_DIR/.env"
echo "    con NOTIFY_EMAIL=tu@email.com (y opcional SMTP_HOST, SMTP_PORT si no usas Postfix local)."
echo "    Luego: systemctl restart thriveformative"
echo ""
echo "En GoDaddy DNS, asegúrate de que el registro A de @ apunte a la IP de este servidor."
echo "Para HTTPS (recomendado): sudo apt install certbot python3-certbot-nginx && sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN"
echo ""
