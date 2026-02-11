# Despliegue en GoDaddy + Ubuntu (thriveformative.com)

## 1. Sincronizar código con GitHub ✅

Tu código ya está subido a: **https://github.com/ytmness/thriveformative**

Se ha hecho commit y push de:
- `app/[locale]/info/page.tsx`
- `app/styles/base.css`
- Carpeta `5x/` (imágenes)
- `.gitignore` (excluye `.cursor/`)

---

## 2. DNS en GoDaddy

Para que **thriveformative.com** y **www.thriveformative.com** apunten a tu servidor:

| Tipo | Nombre | Valor / Datos | TTL |
|------|--------|----------------|-----|
| **A** | `@` | **144.202.72.150** | 600 segundos (o 1 hora) |
| **CNAME** | `www` | **thriveformative.com** | 1 hora |

**Qué hacer en GoDaddy:**

1. Entra en **Mis Productos** → tu dominio **thriveformative.com** → **DNS** o **Administrar DNS**.
2. **Edita** el registro **A** de `@` que ahora está en "Parked":
   - **Apuntar a:** IP → **144.202.72.150**
   - Guarda.
3. El **CNAME** de `www` → `thriveformative.com` ya está bien; así `www` usará la misma IP que `@`.

No elimines los registros **NS** ni **SOA**; déjalos como están.

La propagación DNS puede tardar desde unos minutos hasta 24–48 horas.

---

## 3. Despliegue en el servidor Ubuntu

Conéctate por SSH:

```bash
ssh root@144.202.72.150
```

### Opción A: Usar el script automático

En el servidor:

```bash
# Descargar el script desde el repo y ejecutarlo
curl -sSL https://raw.githubusercontent.com/ytmness/thriveformative/main/scripts/deploy-ubuntu.sh -o deploy-ubuntu.sh
chmod +x deploy-ubuntu.sh
sudo bash deploy-ubuntu.sh
```

El script:

- Instala Node.js 20 si no está
- Clona el repo en `/var/www/thriveformative`
- Ejecuta `npm ci` y `npm run build`
- Configura un servicio systemd `thriveformative`
- Instala y configura Nginx como proxy a la app (puerto 3000)

### Opción B: Pasos manuales

```bash
# Instalar Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo bash -
sudo apt-get install -y nodejs git nginx

# Clonar y construir
sudo mkdir -p /var/www
sudo git clone https://github.com/ytmness/thriveformative.git /var/www/thriveformative
cd /var/www/thriveformative
sudo npm ci
sudo npm run build

# Copiar public y static para modo standalone
sudo cp -r public .next/standalone/
sudo cp -r .next/static .next/standalone/.next/

# Servicio systemd (crear /etc/systemd/system/thriveformative.service como en el script)
sudo systemctl daemon-reload
sudo systemctl enable thriveformative
sudo systemctl start thriveformative

# Nginx: proxy de puerto 80 → 3000 para thriveformative.com y www
# (usar la config del script o equivalente)
sudo nginx -t && sudo systemctl reload nginx
```

---

## 4. HTTPS con Let's Encrypt (recomendado)

Cuando el dominio ya apunte a **144.202.72.150**:

```bash
ssh root@144.202.72.150
sudo apt update
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d thriveformative.com -d www.thriveformative.com
```

Certbot configurará SSL en Nginx y la renovación automática.

---

## 5. Actualizar el sitio cada vez que hagas cambios

**Copia y pega este bloque completo en el servidor** (después de hacer push desde tu PC):

```bash
cd /var/www/thriveformative
git pull origin main
npm run build
cp -r public .next/standalone/
cp -r .next/static .next/standalone/.next/
sudo systemctl restart thriveformative
```

Orden: entrar en la carpeta → traer cambios de GitHub → construir → copiar `public` y estáticos al standalone → reiniciar el servicio. Sin saltarte ningún paso se evitan 404/400 en logos y en JS/CSS.

**Alternativa:** en el servidor puedes ejecutar solo el script (hace pull + build + copias + restart):
```bash
cd /var/www/thriveformative
bash scripts/update-site.sh
```

En el navegador, después de actualizar: **Ctrl+Shift+R** (o Cmd+Shift+R en Mac) para recarga sin caché.

---

### Si algo sigue fallando: rebuild limpio

Solo si las imágenes o los estáticos no se actualizan, haz un build desde cero:

```bash
cd /var/www/thriveformative
git pull origin main
rm -rf .next
npm run build
cp -r public .next/standalone/
cp -r .next/static .next/standalone/.next/
sudo systemctl restart thriveformative
```

---

## Resumen

| Paso | Acción |
|------|--------|
| GitHub | Código actualizado en https://github.com/ytmness/thriveformative |
| GoDaddy DNS | A @ → **144.202.72.150**; CNAME www → thriveformative.com |
| Servidor | SSH `root@144.202.72.150` y ejecutar `deploy-ubuntu.sh` (o pasos manuales) |
| HTTPS | Tras DNS: `certbot --nginx -d thriveformative.com -d www.thriveformative.com` |

Si quieres, el siguiente paso puede ser ejecutar el script en tu servidor y revisar juntos cualquier error que salga.
