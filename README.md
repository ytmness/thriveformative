# Thrive Formative — Wellness from Within

Página web profesional para clínica de medicina familiar y funcional.

## 🎨 Características

- **Next.js 15** con TypeScript para estructura moderna y SEO optimizado
- **Tailwind CSS** para estilos rápidos y consistentes
- **4 Temas visuales** (Golden Sand, Nocturnal, Metallics, Earth Modern)
- **Sistema de variables CSS** para cambios de paleta sin reescribir componentes
- **Framer Motion** para animaciones suaves del botón y transiciones
- **Tipografías del brand guide**: Montserrat (display) y Poppins (body)
- **Responsive** y optimizado para móviles

## 📋 Requisitos

- Node.js 18 o superior
- npm o pnpm

## 🚀 Instalación

1. **Instala las dependencias:**

```bash
npm install
```

2. **Inicia el servidor de desarrollo:**

```bash
npm run dev
```

3. **Abre tu navegador en:**

```
http://localhost:3000
```

## 🎯 Estructura del proyecto

```
thrive-formative/
├── app/
│   ├── globals.css          # Estilos globales + sistema de temas
│   ├── layout.tsx           # Layout principal con fuentes
│   └── page.tsx             # Landing page completa
├── components/
│   └── theme/
│       ├── ThemeProvider.tsx   # Context provider para temas
│       └── ThemeSwitcher.tsx   # Botón animado de cambio de tema
├── tailwind.config.ts       # Configuración de Tailwind
├── tsconfig.json            # Configuración de TypeScript
└── package.json             # Dependencias del proyecto
```

## 🎨 Temas disponibles

1. **Golden Sand** — Cálido, clínico-premium, minimal (default)
2. **Nocturnal** — Oscuro elegante, lujo discreto
3. **Metallics** — Pearl + gold/rose/patina, look boutique
4. **Earth Modern** — Tierra contemporánea, contraste balanceado

Los temas se cambian con el botón flotante "Cambiar vista" en la esquina inferior derecha.

## 📄 Secciones de la página

- **Hero** — Título principal + CTAs + estadísticas del flujo
- **Qué hacemos** — Medicina funcional, familiar y acompañamiento
- **Servicios** — 6 servicios principales
- **Planes** — Base, Pro, Premium
- **Sobre el Doctor** — Foto + enfoque clínico + valores
- **Testimonios** — 3 testimonios de pacientes
- **FAQ** — Preguntas frecuentes
- **Contacto** — WhatsApp, correo, teléfono, ubicación

## ✏️ Personalización

### Cambiar el número de WhatsApp

Edita `app/page.tsx` en la línea 4:

```typescript
const WHATSAPP_LINK = "https://wa.me/521XXXXXXXXXX?text=...";
```

Reemplaza `1XXXXXXXXXX` con tu número (incluye código de país).

### Agregar información del doctor

Edita la sección `#doctor` en `app/page.tsx`:
- Reemplaza el placeholder de foto
- Agrega el nombre del doctor
- Actualiza la descripción

### Agregar contacto real

Edita la sección `#contacto` en `app/page.tsx`:
- Correo electrónico
- Teléfono
- Dirección física
- Embed de Google Maps

### Modificar colores de un tema

Edita `app/globals.css` y ajusta las variables CSS del tema que desees:

```css
[data-theme="golden-sand"]{
  --bg: 247 245 240;        /* Fondo principal */
  --surface: 242 236 230;   /* Superficie de cards */
  --text: 26 26 26;         /* Color del texto */
  --primary: 212 164 115;   /* Color primario */
  /* ... */
}
```

## 🌐 Despliegue

### Vercel (Recomendado)

1. Sube tu código a GitHub
2. Ve a [vercel.com](https://vercel.com)
3. Importa tu repositorio
4. Vercel detectará automáticamente Next.js y lo desplegará

### Otros servicios

- **Netlify** — Soporte completo para Next.js
- **Railway** — Deploy automático desde Git
- **AWS Amplify** — Hosting escalable

## 📝 Próximos pasos

- [ ] Agregar número de WhatsApp real
- [ ] Subir foto del doctor
- [ ] Definir precios de los planes
- [ ] Agregar testimonios reales (con autorización)
- [ ] Integrar Google Maps
- [ ] Agregar analytics (Google Analytics / Plausible)
- [ ] Integrar sistema de citas (Calendly / HubSpot)
- [ ] Configurar dominio personalizado

## 📚 Documentación adicional

- [Next.js Docs](https://nextjs.org/docs)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Framer Motion Docs](https://www.framer.com/motion/)

## 🤝 Soporte

Para preguntas o ayuda adicional con el proyecto, contacta al desarrollador.

---

**Thrive Formative** — Medicina familiar y funcional con 28 años de experiencia.
