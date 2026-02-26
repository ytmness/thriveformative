# Plantillas de email Thrive Formative (Supabase)

Estos HTML están pensados para **Authentication → Email Templates** en el Dashboard de Supabase. Usan el estilo de la web (fondo beige `#f7f5f0`, superficie `#f2ece6`, texto oscuro, acento dorado `#d4a473`) y muestran el **logo** de Thrive Formative.

## Cómo usarlas

1. Abre **Supabase Dashboard** → tu proyecto → **Authentication** → **Email Templates**.
2. **Confirm signup:** abre la plantilla "Confirm signup", borra el contenido y pega todo el contenido de `confirm-signup.html`. Guarda.
3. **Magic Link:** abre "Magic Link", borra el contenido y pega todo el contenido de `magic-link.html`. Guarda.

## Logo en el correo

El logo se carga con esta URL en las plantillas:

```html
<img src="{{ .SiteURL }}/logos/Logo-Golden-Sand-color-06.png" ... />
```

- **{{ .SiteURL }}** es la “Site URL” de tu proyecto en Supabase.
- Para que el logo se vea en el correo, en **Authentication → URL Configuration** pon como **Site URL** tu dominio público (por ejemplo `https://thriveformative.com` o `https://www.tudominio.com`), **no** la URL del proyecto de Supabase.
- El archivo del logo debe estar publicado en tu sitio en la ruta `/logos/Logo-Golden-Sand-color-06.png` (es decir, en `public/logos/Logo-Golden-Sand-color-06.png` en tu repo).

Si tu sitio aún no está en producción, puedes usar temporalmente una URL absoluta de una imagen alojada (por ejemplo en Supabase Storage o en un CDN) sustituyendo en la plantilla:

```html
<img src="https://tu-url-publica-del-logo.png" alt="Thrive Formative" ... />
```

## Variables de Supabase en las plantillas

- **{{ .Token }}** – Código OTP de 6 dígitos (ya está en ambas plantillas).
- **{{ .SiteURL }}** – URL del sitio configurada en el proyecto (para el logo y enlaces).
- **{{ .Email }}** – Email del destinatario (por si quieres saludar por nombre o mostrar el email).
- **{{ .ConfirmationURL }}** – Enlace de confirmación (opcional; con OTP a veces no se usa).

## Colores Thrive Formative usados

- Fondo página: `#f7f5f0`
- Fondo tarjeta: `#f2ece6`
- Texto principal: `#1a1a1a`
- Texto secundario: `#514e4d`
- Acento / código: `#d4a473`
