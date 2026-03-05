# Correos desde la app (Postfix / nodemailer)

La app envía correos con **nodemailer** usando el servidor de correo del mismo host (Postfix). El remitente es `Thrive Formative <info@thriveformative.com>`.

## Cuándo se envían

| Evento | Destinatario | Asunto / contenido |
|--------|--------------|---------------------|
| **Cita agendada** (usuario reserva) | Email del usuario | "Cita recibida, pendiente de aprobación" |
| **Cita confirmada** (admin confirma) | Email del cliente | "Cita confirmada" |
| **Cita cancelada** (admin cancela) | Email del cliente | "Cita cancelada" |
| **Formulario de contacto enviado** | Usuario que envió | "Hemos recibido tu mensaje" |
| **Formulario de contacto enviado** | Admin (`NOTIFY_EMAIL`) | "Nueva solicitud de contacto: …" |

## Variables de entorno

En el servidor donde corre la app (junto a Postfix):

- **NOTIFY_EMAIL**: email donde recibir avisos de nuevas solicitudes de contacto (ej. `info@thriveformative.com`).
- Opcional, si Postfix no está en localhost o usa otro puerto/auth:
  - **SMTP_HOST**, **SMTP_PORT**, **SMTP_SECURE**, **SMTP_USER**, **SMTP_PASS**.

Por defecto la app usa `localhost:25` (Postfix local). Si Postfix está configurado como relay (p. ej. GoDaddy), los correos salen por ese relay.

## Relación con la Edge Function de Supabase

Si tienes configurada la Edge Function `send-appointment-email` y el webhook en `appointments`, **también** se puede enviar el correo de confirmación/cancelación desde Supabase (Resend). La app **además** envía ese mismo correo con Postfix. Puedes dejar solo una de las dos vías (app o Edge Function) para no duplicar correos.
