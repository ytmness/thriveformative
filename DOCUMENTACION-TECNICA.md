# 📘 Documentación Técnica - Thrive Formative

## 🏗️ Arquitectura del Proyecto

### Stack Tecnológico

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| **Next.js** | 15.1.0 | Framework React con SSR y routing |
| **React** | 18.3.1 | Librería UI |
| **TypeScript** | 5.x | Tipado estático |
| **Tailwind CSS** | 3.4.1 | Framework CSS utility-first |
| **Framer Motion** | 11.x | Animaciones suaves |
| **Lucide React** | 0.469.0 | Íconos modernos |

### ¿Por qué este stack?

#### Next.js
- **SEO optimizado**: Renderizado del lado del servidor
- **Performance**: Code splitting automático
- **Developer Experience**: Hot reload, TypeScript built-in
- **Despliegue fácil**: Vercel, Netlify, etc.

#### TypeScript
- **Previene errores**: Tipos en tiempo de compilación
- **Autocompletado**: Mejor DX en VSCode/Cursor
- **Mantenibilidad**: Código más robusto

#### Tailwind CSS
- **Velocidad**: No escribir CSS custom
- **Consistencia**: Sistema de diseño unificado
- **Responsive**: Mobile-first por defecto
- **Theming**: CSS variables + Tailwind = sistema de temas potente

#### Framer Motion
- **Animaciones declarativas**: Fácil de entender
- **Performance**: Usa GPU acceleration
- **Gestures**: Hover, tap, drag listos para usar

---

## 🎨 Sistema de Temas (Theme System)

### Cómo funciona

El sistema de temas usa **CSS Variables** + **Context API de React**.

#### 1. Variables CSS (`app/globals.css`)

Cada tema define variables RGB sin el `rgb()`:

```css
[data-theme="golden-sand"]{
  --bg: 247 245 240;        /* Fondo */
  --surface: 242 236 230;   /* Cards */
  --text: 26 26 26;         /* Texto */
  --primary: 212 164 115;   /* Botones/acentos */
  /* ... */
}
```

**¿Por qué RGB sin rgb()?**

Permite usar con opacidad en Tailwind:

```tsx
className="bg-[rgb(var(--bg)/0.75)]"  // 75% de opacidad
```

#### 2. Context Provider (`components/theme/ThemeProvider.tsx`)

```typescript
export type ThemeId = "golden-sand" | "nocturnal" | "metals" | "earth-modern";

const ThemeContext = React.createContext<{
  theme: ThemeId;
  setTheme: (t: ThemeId) => void;
}>(null);
```

**Responsabilidades:**
- Mantener el estado del tema actual
- Actualizar el atributo `data-theme` del `<html>`
- Proveer `theme` y `setTheme` a toda la app

#### 3. Theme Switcher (`components/theme/ThemeSwitcher.tsx`)

Botón flotante animado que:
- Muestra un panel con las 4 opciones
- Cambia el tema al hacer clic
- Animaciones con Framer Motion
- Botón "Siguiente" para ciclar temas

### Agregar un nuevo tema

**Paso 1:** Agrega las variables CSS en `app/globals.css`

```css
[data-theme="mi-nuevo-tema"]{
  --bg: 255 255 255;
  --surface: 240 240 240;
  --text: 0 0 0;
  --primary: 100 150 200;
  --secondary: 80 120 180;
  --accent: 150 180 200;
  --border: 0 0 0;
}
```

**Paso 2:** Agrega el tipo en `ThemeProvider.tsx`

```typescript
export type ThemeId = "golden-sand" | "nocturnal" | "metals" | "earth-modern" | "mi-nuevo-tema";

const THEMES = [
  // ... temas existentes
  { id: "mi-nuevo-tema", name: "Mi Tema", description: "Descripción del tema." },
];
```

¡Listo! El nuevo tema aparecerá automáticamente en el selector.

---

## 📁 Estructura de Archivos Detallada

```
thrive-formative/
│
├── app/                          # App Router de Next.js 15
│   ├── globals.css              # Estilos globales + variables CSS de temas
│   ├── layout.tsx               # Layout raíz con <html>, <head>, fuentes
│   └── page.tsx                 # Página principal (landing)
│
├── components/                   # Componentes reutilizables
│   └── theme/
│       ├── ThemeProvider.tsx    # Context provider para sistema de temas
│       └── ThemeSwitcher.tsx    # UI del selector de temas (botón flotante)
│
├── public/                       # Archivos estáticos (imágenes, fuentes, etc.)
│   └── [agregar aquí fotos, logos, etc.]
│
├── .eslintrc.json               # Configuración de ESLint
├── .gitignore                   # Archivos ignorados por Git
├── next.config.js               # Configuración de Next.js
├── package.json                 # Dependencias y scripts npm
├── postcss.config.js            # PostCSS para Tailwind
├── tailwind.config.ts           # Configuración de Tailwind CSS
├── tsconfig.json                # Configuración de TypeScript
│
└── README.md                    # Documentación principal
```

---

## 🎯 Componentes de la Página

### Header (sticky)

```tsx
<header className="sticky top-0 z-40 backdrop-blur bg-[rgb(var(--bg)/0.75)]">
```

- **Sticky**: Se queda fijo al hacer scroll
- **Backdrop blur**: Efecto glassmorphism
- **Responsive nav**: Se oculta en móvil (puede agregar hamburger menu después)

### Secciones principales

| Sección | ID | Propósito |
|---------|-----|-----------|
| Hero | `#inicio` | Título principal + CTAs + stats del flujo |
| Qué hacemos | - | 3 cards explicando el enfoque médico |
| Servicios | `#servicios` | 6 servicios en grid 2x3 |
| Planes | `#planes` | 3 planes (Base, Pro, Premium) |
| Doctor | `#doctor` | Foto + bio + valores |
| Testimonios | - | 3 quotes de pacientes |
| FAQ | `#faq` | 4 preguntas con `<details>` |
| Contacto | `#contacto` | WhatsApp + correo + teléfono + mapa |

### Componentes helper (en `page.tsx`)

```tsx
function Stat()         // Mini-card con label + valor
function Card()         // Card genérico con título + texto
function SectionTitle() // Título de sección + subtítulo
function Service()      // Card de servicio
function Plan()         // Card de plan con lista + botón
function Badge()        // Badge pequeño para valores
function Quote()        // Testimonio
function Faq()          // Pregunta frecuente expandible
```

**Nota:** Estos son funciones dentro de `page.tsx` para simplicidad. Si el proyecto crece, muévelos a `components/ui/`.

---

## 🎨 Paletas de Colores (Brand Guides)

### Golden Sand (Default)
- **Uso**: Clínica premium, cálida, profesional
- **Primario**: `#D4A473` (Golden Sand)
- **Fondo**: `#F7F5F0` (Ivory Mist)
- **Superficie**: `#F2ECE6` (Seashell White)
- **Texto**: `#1A1A1A` (Charcoal Black)

### Nocturnal
- **Uso**: Dark mode elegante, lujo discreto
- **Primario**: `#D4A473` (Golden Sand sobre oscuro)
- **Fondo**: `#0A0C0C` (casi negro)
- **Superficie**: `#121414` (gris muy oscuro)
- **Texto**: `#F2ECE6` (claro sobre oscuro)

### Metallics
- **Uso**: Boutique spa, estética metálica
- **Primario**: `#C5A253` (gold metálico)
- **Secundario**: `#C38A8D` (rose gold)
- **Accent**: `#4B6E6E` (patina green)
- **Fondo**: `#F6F4EA` (pearl)

### Earth Modern
- **Uso**: Naturaleza contemporánea, balance
- **Primario**: `#3D4A2C` (deep meadow/olive)
- **Secundario**: `#B48C6E` (toasted almond)
- **Accent**: `#18375C` (nocturnal navy)
- **Fondo**: `#F7F5F0` (ivory)

---

## 🔧 Personalización Común

### 1. Cambiar el número de WhatsApp

**Archivo:** `app/page.tsx` (línea 4)

```typescript
const WHATSAPP_LINK = "https://wa.me/521XXXXXXXXXX?text=Hola%20quiero%20agendar%20una%20consulta%20inicial%20en%20Thrive%20Formative";
```

Reemplaza `1XXXXXXXXXX` con tu número:
- Formato: código de país + número sin espacios
- Ejemplo México: `5218110001234`
- Ejemplo USA: `15551234567`

### 2. Cambiar el tema por defecto

**Archivo:** `components/theme/ThemeProvider.tsx` (línea 17)

```typescript
const [theme, setTheme] = React.useState<ThemeId>("golden-sand");
```

Cambia `"golden-sand"` por:
- `"nocturnal"`
- `"metals"`
- `"earth-modern"`

### 3. Agregar Google Maps

**Archivo:** `app/page.tsx`, sección `#contacto`

Reemplaza:

```tsx
<div className="mt-4 h-64 rounded-xl bg-[rgb(var(--bg)/0.7)] ...">
  Google Maps embed / dirección (placeholder)
</div>
```

Por:

```tsx
<iframe
  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d..."
  width="100%"
  height="256"
  style={{ border: 0, borderRadius: "0.75rem" }}
  allowFullScreen
  loading="lazy"
  referrerPolicy="no-referrer-when-downgrade"
/>
```

Obtén el embed code en Google Maps → Share → Embed a map.

### 4. Agregar logo

**Paso 1:** Guarda tu logo en `public/logo.svg` o `public/logo.png`

**Paso 2:** En `app/page.tsx`, reemplaza el texto del header:

```tsx
<div className="font-display tracking-[0.18em] text-sm">
  THRIVE FORMATIVE
  <div className="text-xs text-muted tracking-[0.22em]">WELLNESS FROM WITHIN</div>
</div>
```

Por:

```tsx
<img src="/logo.svg" alt="Thrive Formative" className="h-12" />
```

### 5. Cambiar fuentes

**Archivo:** `app/layout.tsx`

```typescript
import { Montserrat, Poppins } from "next/font/google";

const montserrat = Montserrat({ subsets: ["latin"], variable: "--font-display" });
const poppins = Poppins({ subsets: ["latin"], weight: ["300","400","500","600"], variable: "--font-body" });
```

Puedes cambiar por cualquier fuente de Google Fonts:

```typescript
import { Playfair_Display, Inter } from "next/font/google";

const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-display" });
const inter = Inter({ subsets: ["latin"], variable: "--font-body" });
```

---

## 🚀 Build y Deploy

### Development

```bash
npm run dev
```

- Corre en `http://localhost:3000`
- Hot reload automático
- Mensajes de error útiles

### Production Build (local)

```bash
npm run build
npm start
```

- Build optimizado
- Sin hot reload
- Listo para usuarios reales

### Deploy a Vercel (recomendado)

1. Sube el proyecto a GitHub
2. Ve a [vercel.com](https://vercel.com)
3. Click "Import Project"
4. Selecciona tu repo
5. Click "Deploy"
6. ¡Listo! URL pública en 30 segundos

**Ventajas de Vercel:**
- Gratis para proyectos personales
- SSL automático (HTTPS)
- CDN global (rápido en todo el mundo)
- Preview URLs para cada commit
- Zero-config (detecta Next.js automáticamente)

### Deploy a Netlify

Similar a Vercel:
1. Arrastra la carpeta a Netlify Drop, o
2. Conecta GitHub y auto-deploy en cada push

### Configurar dominio personalizado

**En Vercel:**
1. Ve a tu proyecto → Settings → Domains
2. Agrega `tudominio.com`
3. Configura DNS según instrucciones
4. Espera propagación (5 min - 24 hrs)

---

## 🔒 Seguridad y Privacidad

### Variables de entorno

Si necesitas API keys (Google Maps, analytics, etc.):

**Paso 1:** Crea `.env.local` en la raíz:

```env
NEXT_PUBLIC_GOOGLE_MAPS_KEY=tu_api_key_aqui
```

**Paso 2:** Úsala en el código:

```typescript
const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;
```

**Nota:** Variables con `NEXT_PUBLIC_` son visibles en el navegador (ok para keys públicas). Sin el prefijo, solo server-side.

### GDPR / Protección de datos

Si usas cookies (analytics, chatbots, etc.):
- Agrega banner de cookies
- Link a política de privacidad
- Obtén consentimiento antes de cookies no esenciales

**Librerías recomendadas:**
- `react-cookie-consent`
- `cookieconsent` (vanilla JS)

---

## 📊 Analytics y SEO

### Google Analytics 4

**Paso 1:** Instala:

```bash
npm install @next/third-parties
```

**Paso 2:** En `app/layout.tsx`:

```typescript
import { GoogleAnalytics } from '@next/third-parties/google'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <GoogleAnalytics gaId="G-XXXXXXXXXX" />
      </body>
    </html>
  )
}
```

### SEO Meta Tags

Ya incluidos en `app/layout.tsx`:

```typescript
export const metadata: Metadata = {
  title: "Thrive Formative — Wellness from Within",
  description: "Medicina familiar y funcional, atención personalizada...",
};
```

**Para mejorar SEO:**

```typescript
export const metadata: Metadata = {
  title: "Thrive Formative — Medicina Funcional en Monterrey",
  description: "Clínica de medicina familiar y funcional en San Pedro y Monterrey. 28 años de experiencia. Consultas personalizadas, planes integrales.",
  keywords: ["medicina funcional", "San Pedro", "Monterrey", "medicina familiar", "longevidad"],
  openGraph: {
    title: "Thrive Formative",
    description: "Medicina funcional personalizada",
    url: "https://tudominio.com",
    images: ["/og-image.jpg"],
  },
};
```

---

## 🐛 Debugging y Troubleshooting

### El servidor no inicia

```bash
rm -rf .next node_modules package-lock.json
npm install
npm run dev
```

### Cambios de CSS no se ven

Tailwind cachea. Fuerza rebuild:

```bash
npm run dev
# O si eso no funciona:
rm -rf .next
npm run dev
```

### Errores de TypeScript

VSCode/Cursor muestra errores pero compila:
- Reinicia el TypeScript server: `Cmd+Shift+P` → "TypeScript: Restart TS Server"

### Performance lenta en desarrollo

Normal. En producción (`npm run build`) es mucho más rápido.

---

## 📈 Roadmap / Futuras mejoras

### Fase 1 (Básico)
- [x] Landing page completa
- [x] Sistema de temas
- [x] Responsive design
- [ ] Agregar contenido real (textos, fotos, precios)

### Fase 2 (Funcionalidad)
- [ ] Sistema de agendamiento integrado (Calendly API)
- [ ] Formulario de contacto con validación
- [ ] Blog de medicina funcional (Next.js blog with MDX)
- [ ] Testimonios con fotos y nombres reales

### Fase 3 (Avanzado)
- [ ] Portal de pacientes (login)
- [ ] Descarga de formatos (historia clínica PDF)
- [ ] Integración con CRM (HubSpot / Zoho)
- [ ] Chat en vivo o chatbot

### Fase 4 (Marketing)
- [ ] Email marketing (MailChimp / SendGrid)
- [ ] Lead magnets (guías descargables)
- [ ] A/B testing de landing page
- [ ] Retargeting Pixel (Meta, Google Ads)

---

## 🤝 Contribución y Mantenimiento

### Actualizar dependencias

```bash
npm outdated           # Ver qué está desactualizado
npm update             # Actualizar (respetando semver)
npm install pkg@latest # Actualizar una específica
```

### Estándares de código

- **Formatting**: Prettier (agregar si se requiere)
- **Linting**: ESLint ya configurado
- **Commits**: Convencionales (`feat:`, `fix:`, `docs:`)

---

## 📞 Soporte Técnico

### Recursos

- [Next.js Docs](https://nextjs.org/docs)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Framer Motion Docs](https://www.framer.com/motion/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

### Stack Overflow

Busca por:
- `[next.js]` + tu pregunta
- `[tailwindcss]` + tu pregunta
- `[framer-motion]` + tu pregunta

---

**Thrive Formative** — Documentación técnica v1.0
