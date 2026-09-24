# Thrive Formative

Sitio web de clínica (Next.js 15, Postgres local, i18n).

**Pacientes** agendan e inician sesión en **Pabau** (Booking Portal).  
**Staff** edita CMS/tienda en el admin local (contraseña + cookie), con datos en Postgres.

## Requisitos

- Node.js 18+
- Postgres accesible vía `DATABASE_URL` (en el VPS: Docker `somnus-pg` en `127.0.0.1:5432`)

## Desarrollo

```bash
npm install
cp .env.example .env.local
# Edita DATABASE_URL, ADMIN_PASSWORD, ADMIN_SESSION_SECRET y URLs de Pabau
# Opcional: bash scripts/setup-thrive-db.sh  (crea DB/usuario/schema)
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

Admin: `/es/admin/login` (o tu locale) con `ADMIN_PASSWORD`.

## Base de datos

- Schema: `db/schema.sql` (`cms_*`, `store_*`, `contact_requests`, `notifications`)
- Setup: `scripts/setup-thrive-db.sh`
- Supabase Auth / tablas de citas de pacientes: **deprecado** para Thrive

## Agenda (Pabau)

**Pabau es la agenda de récord.** El sitio no crea citas ni cuentas de paciente.

### URL correcta (pacientes)

| Uso | URL |
|-----|-----|
| Portal / widget / login-registro paciente | `https://partner-us.pabau.com/online-bookings/thrive-formative-llc` |
| ShapeScale | misma base + `?category=314027&services=3571762` |

**No** uses `https://app-us.pabau.com/` para pacientes (es panel de staff).

Configurables vía `NEXT_PUBLIC_PABAU_*` (ver `.env.example`). Helper: `lib/pabau.ts`.

### Embeds

Widget iframe (600×550) en `#citas` — el interior es cross-origin; la estética del portal se cambia en Pabau → Online Booking → Customize / Promote. Nuestro `BrandCtaLink` y la sección alrededor sí son del sitio.

### Quién entra dónde

| Rol | Entrada |
|-----|---------|
| Paciente | Header Login/Registro o CTA Agendar → portal partner-us (Pabau crea/actualiza el cliente) |
| Staff CMS/tienda | `/[locale]/admin/login` con `ADMIN_PASSWORD` (Postgres local) |
| Staff clínica (opcional) | app-us.pabau.com — independiente del CMS Thrive |

## Scripts

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run start` | Servidor de producción |
| `npm run lint` | ESLint |

Variables de entorno: ver `.env.example`.
