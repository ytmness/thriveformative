# Thrive Formative

Sitio web de clínica (Next.js 15, Supabase, i18n).

## Requisitos

- Node.js 18+
- Proyecto Supabase configurado (migraciones en `supabase/migrations/`)

## Desarrollo

```bash
npm install
cp .env.example .env.local
# Edita .env.local con tus credenciales de Supabase y URLs de Pabau
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

## Agenda (Pabau)

**Pabau es la agenda de récord.** El sitio no crea citas en Supabase; los CTA «Agendar» abren el portal de reservas o muestran el widget embebido.

### URLs

| Uso | URL |
|-----|-----|
| Portal / widget | `https://partner-us.pabau.com/online-bookings/thrive-formative-llc` |
| ShapeScale (categoría Diagnostics `314027`, servicio `3571762`, 149 USD) | misma base + `?category=314027&services=3571762` |

Configurables vía `NEXT_PUBLIC_PABAU_*` (ver `.env.example`). Helper: `lib/pabau.ts`.

### Embeds oficiales (Online Booking → Promote)

Botón Book Now (documentado; el sitio usa `BrandCtaLink` por consistencia visual):

```html
<script id="pabau-script" src="https://pabau.com/widgets/online-bookings/book-now-button.js?company_slug=thrive-formative-llc&btnStyle=1"></script>
<div id="pabau-book-now"></div>
```

Widget iframe (600×550) — usado en `#citas`:

```html
<iframe src="https://partner-us.pabau.com/online-bookings/thrive-formative-llc" width="600" height="550"></iframe>
```

### API (solo servidor, Fase 2)

- Base: `https://api.oauth.pabau.com/{ACCESS_TOKEN}/`
- Variable: `PABAU_ACCESS_TOKEN` (nunca `NEXT_PUBLIC_*`)
- Rotar el token: Setup → Integrations → Private Apps / API Keys (`/setup/developer-hub`), app privada «Thrive Formative Web»
- Docs de prueba: https://support.pabau.com/en/api/how-do-i-test-my-api-client  
  Host de test: `https://api.oauth.test.pabau.com/{api}/`

### Sucursales

El branding del sitio (`lib/branding.ts`) sigue mostrando San Pedro Garza García, NL y WhatsApp MX. En Pabau la location actual es **Laredo, TX** (id `24216`, timezone `America/Chicago`). No se sobrescribe la dirección del sitio a propósito: habrá varias sucursales; `PABAU_LOCATIONS` en `lib/pabau.ts` es el lugar para añadir sedes.

Las tablas legacy `appointments` / `booking_*` y el panel Admin → Disponibilidad se conservan como histórico; ya no alimentan el calendario público.

## Scripts

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run start` | Servidor de producción |
| `npm run lint` | ESLint |

Variables de entorno: ver `.env.example`.
