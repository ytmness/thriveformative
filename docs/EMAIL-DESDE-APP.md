# Correos desde la app (Postfix / nodemailer)

La app envía correos con **nodemailer** usando el servidor de correo del mismo host (Postfix). El remitente es `Thrive Formative <info@thriveformative.com>`. El cliente llama a la ruta **POST /api/send-email** (no usa Server Actions) para evitar el error "Failed to find Server Action" tras un deploy.

## Cuándo se envían

| Evento | Destinatario | Asunto / contenido |
|--------|--------------|---------------------|
| **Cita agendada** (usuario reserva) | Email del usuario | "Cita recibida, pendiente de aprobación" |
| **Cita confirmada** (admin confirma) | Email del cliente | "Cita confirmada" |
| **Cita cancelada** (admin cancela) | Email del cliente | "Cita cancelada" |
| **Formulario de contacto enviado** | Usuario que envió | "Hemos recibido tu mensaje" |
| **Formulario de contacto enviado** | Admin (`NOTIFY_EMAIL`) | "Nueva solicitud de contacto: …" |

## Variables de entorno

En el servidor, la app **debe** tener las variables disponibles. Con el script `deploy-ubuntu.sh`, el servicio systemd carga:

**Archivo:** `/var/www/thriveformative/.env` (crear a mano en el servidor; no está en git)

Contenido mínimo recomendado:

```bash
NOTIFY_EMAIL=info@thriveformative.com
```

Opcional, si Postfix no está en localhost o usa otro puerto/auth:

```bash
SMTP_HOST=localhost
SMTP_PORT=25
# SMTP_USER=  SMTP_PASS=  solo si el relay exige autenticación
```

Después de crear o editar `.env`, reiniciar el servicio:

```bash
sudo systemctl restart thriveformative
```

Por defecto la app usa `localhost:25` (Postfix local). Si Postfix está configurado como relay (p. ej. GoDaddy), los correos salen por ese relay.

### Si no llegan correos

1. **Comprobar que existe** `/var/www/thriveformative/.env` y que el servicio se reinició.
2. **Revisar logs en el servidor** (ejecuta en SSH):

   ```bash
   # Últimas 100 líneas del servicio (app + correos)
   sudo journalctl -u thriveformative -n 100 --no-pager

   # En tiempo real mientras pruebas (formulario de contacto, cita, etc.)
   sudo journalctl -u thriveformative -f
   ```

   Busca:
   - `[send-email] Request: contact_confirmation to: xxx@...` → la petición llegó a la API.
   - `[sendEmail] contact_confirmation → enviado OK a xxx@...` → nodemailer envió sin error.
   - `[sendEmail] ... → ECONNREFUSED` → la app no puede conectar a Postfix (revisa que Postfix escuche en 127.0.0.1:25).
   - `[send-email] NOTIFY_EMAIL no configurado` → crea o edita `/var/www/thriveformative/.env` con `NOTIFY_EMAIL=tu@email.com` y reinicia.

3. **Probar Postfix a mano** (desde el servidor): `echo "test" | mail -s "Test" tu@email.com`. Si no llega, el fallo está en Postfix/relay, no en la app.

## Relación con la Edge Function de Supabase

Si tienes configurada la Edge Function `send-appointment-email` y el webhook en `appointments`, **también** se puede enviar el correo de confirmación/cancelación desde Supabase (Resend). La app **además** envía ese mismo correo con Postfix. Puedes dejar solo una de las dos vías (app o Edge Function) para no duplicar correos.
