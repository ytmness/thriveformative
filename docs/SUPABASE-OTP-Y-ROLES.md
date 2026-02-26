# Código de verificación (OTP) en Supabase

Para que **registro** y **login** usen un **código de 6 dígitos** en lugar del enlace mágico, hay que configurar las plantillas de email en el Dashboard de Supabase.

## Plantillas con estilo Thrive Formative y logo

En la carpeta **`docs/supabase-emails/`** tienes dos HTML listos para copiar en Supabase:

- **`confirm-signup.html`** → para **Confirm signup** (correo de registro con código).
- **`magic-link.html`** → para **Magic Link** (correo de login con código).

Incluyen el mismo estilo que la web (fondo beige, tarjeta clara, acento dorado) y el logo de Thrive Formative. Para que el logo se vea, configura en Supabase **Authentication → URL Configuration** la **Site URL** con tu dominio público (ej. `https://thriveformative.com`). Detalles en **`docs/supabase-emails/README.md`**.

## Pasos en Supabase Dashboard

1. Entra en tu proyecto: **https://supabase.com/dashboard** → tu proyecto.
2. Ve a **Authentication** → **Email Templates**.
3. En **Confirm signup**: pega el contenido de `docs/supabase-emails/confirm-signup.html` y guarda.
4. En **Magic Link**: pega el contenido de `docs/supabase-emails/magic-link.html` y guarda.

Las plantillas ya incluyen `{{ .Token }}` y el logo con `{{ .SiteURL }}/logos/Logo-Golden-Sand-color-06.png`.

## Comportamiento en la app

- **Registro:** El usuario rellena nombre, email y contraseña → se envía un email con el código → en la misma página introduce el código → `verifyOtp` con `type: 'signup'` → queda verificado y logueado.
- **Login:** El usuario introduce solo el email → se envía un email con el código → introduce el código → `verifyOtp` con `type: 'email'` → queda logueado.

## Expiración del código

Por defecto el OTP caduca en **1 hora**. Se puede cambiar en:

**Authentication** → **Providers** → **Email** → **Email OTP Expiration** (máx. 86400 segundos = 1 día).

## Roles (admin / cliente)

La migración `supabase/migrations/002_roles.sql` añade la columna `role` en `profiles` con valores `client` (por defecto) y `admin`.

Para ejecutarla en el SQL Editor de Supabase:

1. **SQL Editor** → New query.
2. Pega el contenido de `supabase/migrations/002_roles.sql`.
3. Run.

Para dar rol admin a un usuario (sustituye el email):

```sql
update public.profiles
set role = 'admin'
where id = (select id from auth.users where email = 'tu-admin@ejemplo.com');
```

No hay panel de admin todavía; el rol queda guardado en `profiles` para usarlo cuando lo implementes.

## Si aparece 403 (Forbidden) al verificar el código OTP

Un **403** en `POST .../auth/v1/verify` suele deberse a que el **origen** desde el que se hace la petición no está permitido en Supabase. Revisa lo siguiente en el Dashboard:

1. **Authentication** → **URL Configuration**  
   - **Site URL**: debe ser la URL base de tu app (ej. `https://thriveformative.com` o `http://localhost:3000` en desarrollo).  
   - **Redirect URLs**: añade **todas** las URLs desde las que los usuarios pueden iniciar sesión o verificar el código:
     - Producción: `https://tu-dominio.com`, `https://tu-dominio.com/**`
     - Desarrollo: `http://localhost:3000`, `http://localhost:3000/**`
   - Puedes usar comodines: `**` para cualquier ruta bajo ese origen.

2. **Coincidencia exacta**: La URL desde la que cargas la app (la que sale en la barra del navegador, sin la ruta final) debe coincidir con el **Site URL** o estar incluida en **Redirect URLs**. Por ejemplo, si pruebas en `http://localhost:3000/es/login`, el origen es `http://localhost:3000` → ese valor debe estar en Redirect URLs o ser el Site URL.

3. En la app ya se envía `redirectTo` en `verifyOtp` (origen + locale) para que Supabase acepte la petición; asegúrate de que ese origen esté permitido como arriba.

4. **Código caducado o ya usado**: Si el 403 sigue, puede ser que el token esté vencido o ya utilizado (p. ej. por prefetch del correo). Prueba pidiendo un **código nuevo** y verificándolo de inmediato.
