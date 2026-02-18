#!/bin/bash
# Script de despliegue Thrive Formative en Ubuntu
# Ejecutar como root o con sudo en el servidor: bash deploy-ubuntu.sh

set -e
REPO_URL="https://github.com/ytmness/thriveformative.git"
APP_DIR="/var/www/thriveformative"
DOMAIN="thriveformative.com"

echo "==> Instalando dependencias del sistema..."
apt-get update
apt-get install -y curl git

# Node.js 20 LTS si no está instalado
if ! command -v node &> /dev/null; then
  echo "==> Instalando Node.js 20..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi

echo "==> Node: $(node -v) | npm: $(npm -v)"

# Crear directorio y clonar/actualizar
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

# Copiar archivos estáticos para standalone
if [ -d ".next/standalone" ]; then
  cp -r public .next/standalone/
  cp -r .next/static .next/standalone/.next/
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
cat > /etc/nginx/sites-available/thriveformative << NGXEOF
server {
    listen 80;
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
NGXEOF

ln -sf /etc/nginx/sites-available/thriveformative /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

echo ""
echo "==> Despliegue completado."
echo "    App: http://127.0.0.1:3000"
echo "    Nginx escuchando en puerto 80 para $DOMAIN y www.$DOMAIN"
echo ""
echo "En GoDaddy DNS, asegúrate de que el registro A de @ apunte a la IP de este servidor."
echo "Para HTTPS (recomendado): sudo apt install certbot python3-certbot-nginx && sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN"
echo ""
