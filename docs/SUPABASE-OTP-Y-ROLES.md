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
