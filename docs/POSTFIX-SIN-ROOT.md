# Postfix: enviar como Thrive Formative (sin "root")

Para que los correos no salgan como **root** y lleguen mejor (menos spam), configura Postfix así en el servidor.

## 1. Reescribir el remitente (envelope y cabecera)

En el servidor (SSH):

```bash
# Crear mapa genérico: root -> info@thriveformative.com
echo 'root@mail.thriveformative.com    info@thriveformative.com' | sudo tee /etc/postfix/generic
sudo postmap /etc/postfix/generic
sudo postconf -e "smtp_generic_maps = hash:/etc/postfix/generic"
```

## 2. Reescribir la cabecera From cuando sea "root"

Así el correo muestra "Thrive Formative <info@thriveformative.com>" en lugar de "root <...>":

```bash
echo '/^From: root / REPLACE From: Thrive Formative <info@thriveformative.com>' | sudo tee /etc/postfix/header_checks
sudo postconf -e "header_checks = regexp:/etc/postfix/header_checks"
sudo systemctl reload postfix
```

## 3. Probar

```bash
echo "Prueba sin root" | mail -s "Test Thrive Formative" -r "info@thriveformative.com" sergiooresa@gmail.com
```

Si el comando `mail` sigue poniendo "root" en From, usa esto (envía con cabecera From correcta):

```bash
(
  echo "From: Thrive Formative <info@thriveformative.com>"
  echo "To: sergiooresa@gmail.com"
  echo "Subject: Test Thrive Formative"
  echo ""
  echo "Prueba sin root."
) | sendmail sergiooresa@gmail.com
```

Revisa bandeja y spam; debería aparecer **Thrive Formative** como remitente.

## 4. Limpiar cola (opcional)

Si quedaron mensajes viejos en cola:

```bash
sudo postsuper -d ALL
```
