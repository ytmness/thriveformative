# Email de cita confirmada/cancelada (Supabase Edge Function)

El envío del correo cuando se confirma o cancela una cita lo hace **Supabase** mediante una Edge Function y un webhook de base de datos.

## 1. Desplegar la Edge Function

Desde la raíz del proyecto (con [Supabase CLI](https://supabase.com/docs/guides/cli) instalada y vinculada a tu proyecto):

```bash
supabase functions deploy send-appointment-email --no-verify-jwt
```

`--no-verify-jwt` permite que el webhook (que no envía JWT) pueda invocar la función.

## 2. Configurar secretos

La función necesita la API key de Resend y, opcionalmente, el remitente:

```bash
supabase secrets set RESEND_API_KEY=re_xxxxxxxxxxxx
supabase secrets set RESEND_FROM="Thrive Formative <notificaciones@tudominio.com>"
```

- **RESEND_API_KEY**: API key de [Resend](https://resend.com).
- **RESEND_FROM**: Email remitente (en producción usa un dominio verificado en Resend).

## 3. Crear el webhook en la base de datos

Cuando se **actualiza** una fila en `appointments`, Supabase debe llamar a la Edge Function:

1. Entra en **Supabase Dashboard** → **Database** → **Webhooks** (o **Integrations** → **Webhooks**).
2. **Create a new webhook**.
3. **Table**: `appointments`.
4. **Events**: marca **Update**.
5. **URL**:  
   `https://TU_PROJECT_REF.supabase.co/functions/v1/send-appointment-email`  
   (sustituye `TU_PROJECT_REF` por el ID de tu proyecto).
6. Guarda el webhook.

A partir de ahí, cada vez que se actualice una cita (por ejemplo al confirmar o cancelar desde el panel admin), Supabase enviará el payload a la función y esta enviará el email con Resend si el perfil del usuario tiene email y `RESEND_API_KEY` está configurado.

## Resumen del flujo

1. El admin confirma o cancela una cita en el panel → se actualiza `appointments.status`.
2. El webhook de Supabase dispara y hace POST a la Edge Function con el registro nuevo y el anterior.
3. La función comprueba que el nuevo estado sea `confirmed` o `cancelled`, obtiene el email del perfil del usuario y envía el correo con Resend.

La **notificación in-app** (campanita) sigue creándose desde la app al confirmar/cancelar; solo el **email** se envía desde Supabase.
