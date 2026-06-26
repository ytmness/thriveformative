#!/bin/bash
# Parchea la config Nginx existente (p. ej. tras Certbot) sin reemplazarla entera.
# Añade map $status y Cache-Control no-store en respuestas 502/503/504.
#
# Uso en el servidor:
#   sudo bash /var/www/thriveformative/scripts/patch-nginx-error-cache.sh
#
set -e

DOMAIN="${DOMAIN:-thriveformative.com}"
NGINX_CONF="${NGINX_CONF:-/etc/nginx/sites-available/thriveformative}"
BACKUP="${NGINX_CONF}.bak.$(date +%Y%m%d%H%M%S)"

if [ ! -f "$NGINX_CONF" ]; then
  echo "ERROR: No existe $NGINX_CONF"
  echo "    Ejecuta primero: sudo bash scripts/apply-nginx-proxy-only.sh"
  exit 1
fi

if grep -q 'thrive_error_cache_control' "$NGINX_CONF"; then
  echo "==> Ya aplicado: $NGINX_CONF incluye thrive_error_cache_control"
  nginx -t
  exit 0
fi

cp -a "$NGINX_CONF" "$BACKUP"
echo "==> Copia de seguridad: $BACKUP"

TMP="$(mktemp)"
MAP_BLOCK='# No cachear errores de gateway (502/503/504) — thriveformative
map $status $thrive_error_cache_control {
    ~^50[234]  "no-store, no-cache, must-revalidate, max-age=0";
    default    "";
}
'

# Insertar map al inicio del archivo
printf '%s\n' "$MAP_BLOCK" > "$TMP"
cat "$NGINX_CONF" >> "$TMP"

# Añadir add_header y timeouts en cada bloque location / que haga proxy_pass
python3 - "$TMP" << 'PY'
import re
import sys

path = sys.argv[1]
text = open(path, encoding="utf-8").read()

header_line = "        add_header Cache-Control $thrive_error_cache_control always;"
timeout_lines = [
    "        proxy_connect_timeout 10s;",
    "        proxy_send_timeout 60s;",
    "        proxy_read_timeout 60s;",
]

def patch_location(block: str) -> str:
    if "proxy_pass" not in block:
        return block
    if "thrive_error_cache_control" in block:
        return block
    insert_after = "proxy_cache_bypass"
    lines = block.splitlines()
    out = []
    inserted_timeouts = False
    inserted_header = False
    for line in lines:
        out.append(line)
        if not inserted_timeouts and "proxy_cache_bypass" in line:
            for t in timeout_lines:
                out.append(t)
            inserted_timeouts = True
        if not inserted_header and insert_after in line:
            out.append(header_line)
            inserted_header = True
    if not inserted_header:
        # Sin proxy_cache_bypass: insertar antes del cierre del bloque
        if out and out[-1].strip() == "}":
            out.insert(-1, header_line)
            for t in reversed(timeout_lines):
                out.insert(-1, t)
    return "\n".join(out)

pattern = re.compile(r"location\s+/\s*\{.*?\n    \}", re.DOTALL)
text, count = pattern.subn(lambda m: patch_location(m.group(0)), text)
if count == 0:
    print("WARN: no se encontró location / con proxy_pass; revisa $NGINX_CONF manualmente", file=sys.stderr)
open(path, "w", encoding="utf-8").write(text)
print(f"==> Parcheados {count} bloque(s) location /")
PY

mv "$TMP" "$NGINX_CONF"

nginx -t
systemctl reload nginx
echo "==> Nginx recargado: errores 502/503/504 ya no se cachean en el navegador."
echo "    Prueba tras un deploy: el 502/503 no debería quedarse guardado en caché."
