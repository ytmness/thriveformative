# Thrive Formative

Sitio web de clínica (Next.js 15, Supabase, i18n).

## Requisitos

- Node.js 18+
- Proyecto Supabase configurado (migraciones en `supabase/migrations/`)

## Desarrollo

```bash
npm install
cp .env.example .env.local
# Edita .env.local con tus credenciales de Supabase
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

## Scripts

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run start` | Servidor de producción |
| `npm run lint` | ESLint |

Variables de entorno: ver `.env.example`.
