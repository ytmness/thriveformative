# Auth con Supabase (magic link)

Registro y login hacen **lo mismo**: solo email → enlace mágico. Si el usuario no existe, se crea automáticamente (`signInWithOtp` con `shouldCreateUser: true`). No se usa `signUp(email, password)`, así se evita el límite bajo de correos del plan Free.

## Comportamiento en la app

- **Login y Register:** Una sola pantalla con email. Al enviar se llama `signInWithOtp({ email, options: { shouldCreateUser: true, emailRedirectTo: origin + '/auth/callback' } })`.
- **Magic link:** El usuario recibe un correo con un enlace. Al hacer clic, llega a `/auth/callback?code=...`. La ruta hace `exchangeCodeForSession(code)` y redirige a la app (o a `?next=...`). No hay paso de “introducir código” en la UI.
- **Redirect URLs:** En Supabase **Authentication → URL Configuration** debe estar permitida la URL de callback, p. ej. `https://tudominio.com/auth/callback` y `http://localhost:3000/auth/callback`.

## Plantillas de email (opcional)

En **`docs/supabase-emails/`** hay plantillas con estilo Thrive (Magic Link, Confirm signup). Si usas solo magic link, basta personalizar **Magic Link** en **Authentication → Email Templates**. Detalles en **`docs/supabase-emails/README.md`**.

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

## Por qué sale 429 (Too Many Requests) en signup / login

En el **plan Free**, Supabase usa un SMTP por defecto con un límite muy bajo: **solo 2 correos por hora** para todo el proyecto (signup, recuperar contraseña y cambio de email suman al mismo límite). No es un bug de tu código: es la cuota del plan con el servidor de correo integrado.

- **Por qué en otros proyectos no te limita:** El límite de 2 correos/hora es **el mismo** en todos los proyectos que usan el SMTP por defecto. La diferencia suele ser: (1) **Uso:** en este proyecto has hecho muchos intentos de registro en poco tiempo; en el otro, menos. (2) **Custom SMTP:** si en el otro proyecto tienes configurado SMTP custom (SendGrid, Brevo, etc.), ese proyecto ya no usa el límite de 2/hora.
- **Cómo comprobarlo:** En este proyecto: **Dashboard → Authentication → Rate Limits**. En el otro: mismo menú y además **Project Settings → Auth → SMTP**; si tiene Custom SMTP configurado, ese es el motivo.
- **Qué hacer:**
  1. **Desarrollo:** Esperar ~1 h o usar SMTP custom en **Project Settings → Auth → SMTP**.
  2. **Producción:** Configurar **Custom SMTP** en Supabase (Authentication → SMTP) para no depender del límite de 2/hora.

En la app hay un mensaje amigable para el 429 (`auth.rateLimit`) y un cooldown tras enviar el formulario para evitar envíos dobles por doble clic.
