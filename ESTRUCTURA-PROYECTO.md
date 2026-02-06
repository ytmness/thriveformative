# 📂 Estructura del Proyecto - Thrive Formative

## Vista de Árbol Completa

```
thrive-formative/
│
├── 📱 APLICACIÓN (Código fuente)
│   │
│   ├── app/                                    [Carpeta principal de Next.js App Router]
│   │   ├── globals.css                         [Estilos globales + sistema de temas CSS]
│   │   ├── layout.tsx                          [Layout raíz con fuentes y metadata]
│   │   └── page.tsx                            [Landing page completa con todas las secciones]
│   │
│   ├── components/                             [Componentes reutilizables]
│   │   └── theme/
│   │       ├── ThemeProvider.tsx               [Context API para gestión de temas]
│   │       └── ThemeSwitcher.tsx               [Botón animado selector de temas]
│   │
│   └── public/                                 [Archivos estáticos (crear cuando sea necesario)]
│       ├── logo.svg                            [Logo de la clínica (agregar)]
│       ├── doctor.jpg                          [Foto del doctor (agregar)]
│       └── favicon.ico                         [Ícono del sitio (personalizar)]
│
├── ⚙️ CONFIGURACIÓN (Archivos técnicos)
│   │
│   ├── package.json                            [Dependencias y scripts npm]
│   ├── tsconfig.json                           [Configuración TypeScript]
│   ├── tailwind.config.ts                      [Configuración Tailwind CSS]
│   ├── postcss.config.js                       [Configuración PostCSS]
│   ├── next.config.js                          [Configuración Next.js]
│   ├── .eslintrc.json                          [Configuración ESLint]
│   └── .gitignore                              [Archivos ignorados por Git]
│
└── 📚 DOCUMENTACIÓN (Guías y manuales)
    │
    ├── EMPIEZA-AQUI.md                         [👈 PUNTO DE PARTIDA - Lee esto primero]
    ├── README.md                               [Guía principal del proyecto]
    ├── RESUMEN-EJECUTIVO.md                    [Visión completa de todo el proyecto]
    │
    ├── 🛠️ TÉCNICO
    │   ├── INSTRUCCIONES-INSTALACION.md        [Cómo instalar Node.js y correr el sitio]
    │   ├── DOCUMENTACION-TECNICA.md            [Arquitectura, temas, personalización avanzada]
    │   └── CONFIGURACION-PERSONALIZADA.md      [Guía rápida para personalizar contenido]
    │
    ├── 🏥 OPERATIVO
    │   ├── MANUAL-OPERACION.md                 [Flujo de pacientes, políticas, scripts]
    │   └── CONTRATO-CONSENTIMIENTO.md          [Plantilla de contrato médico]
    │
    └── 📈 MARKETING
        └── PLAN-MARKETING.md                   [Estrategia completa de marketing]
```

---

## 📁 Detalle por Carpeta

### 🔹 `app/` — Aplicación Principal

#### `globals.css`
**Propósito:** Estilos globales y sistema de temas

**Contenido:**
- Importación de Tailwind (`@tailwind base`, `@tailwind components`, `@tailwind utilities`)
- Variables CSS para 4 temas:
  - `[data-theme="golden-sand"]`
  - `[data-theme="nocturnal"]`
  - `[data-theme="metals"]`
  - `[data-theme="earth-modern"]`
- Clases utility custom:
  - `.bg-surface`
  - `.text-muted`
  - `.btn-primary`
  - `.btn-outline`

**Cuándo editar:** Para cambiar colores de un tema

---

#### `layout.tsx`
**Propósito:** Layout raíz de la aplicación

**Contenido:**
- Configuración de fuentes (Montserrat + Poppins)
- Metadata (título, descripción para SEO)
- Estructura `<html>` y `<body>`

**Cuándo editar:**
- Cambiar fuentes
- Actualizar metadata (título, descripción)
- Agregar Google Analytics
- Agregar Favicon

---

#### `page.tsx`
**Propósito:** Landing page completa (página principal)

**Contenido:**
- Header con navegación
- Sección Hero (título + CTAs)
- Sección "Qué hacemos"
- Servicios (6 cards)
- Planes (Base, Pro, Premium)
- Sobre el Doctor
- Testimonios
- FAQ
- Contacto
- Footer

**Cuándo editar:**
- Cambiar textos
- Actualizar WhatsApp
- Agregar información del doctor
- Modificar servicios/precios
- Actualizar testimonios

**Componentes internos:**
```tsx
<Stat />         // Mini card con estadística
<Card />         // Card genérico
<SectionTitle /> // Título de sección
<Service />      // Card de servicio
<Plan />         // Card de plan
<Badge />        // Badge pequeño
<Quote />        // Testimonio
<Faq />          // Pregunta frecuente
```

---

### 🔹 `components/theme/` — Sistema de Temas

#### `ThemeProvider.tsx`
**Propósito:** Context provider para gestión de temas

**Funcionalidad:**
- Mantiene estado del tema actual
- Actualiza atributo `data-theme` en `<html>`
- Provee `theme` y `setTheme` a toda la app

**Cuándo editar:**
- Cambiar tema por defecto (línea 17)
- Agregar nuevo tema

---

#### `ThemeSwitcher.tsx`
**Propósito:** Botón flotante para cambiar temas

**Funcionalidad:**
- Muestra panel con 4 opciones de temas
- Animaciones con Framer Motion
- Botón "Siguiente" para ciclar temas

**Cuándo editar:**
- Cambiar posición del botón (esquina)
- Modificar estilos del panel
- Agregar/quitar temas del selector

---

### 🔹 `public/` — Archivos Estáticos

**⚠️ Esta carpeta NO está creada aún. Créala cuando necesites agregar:**

- **Logo de la clínica** (`logo.svg` o `logo.png`)
- **Foto del doctor** (`doctor.jpg`)
- **Favicon personalizado** (reemplazar `app/favicon.ico`)
- **Imágenes** para testimonios, servicios, etc.
- **PDFs** (lead magnet, guía de salud)

**Cómo usar:**

```tsx
// En tu código:
<img src="/logo.svg" alt="Thrive Formative" />
// Next.js busca automáticamente en public/
```

---

## 📄 Detalle de Documentos

### 📘 `EMPIEZA-AQUI.md`
**👈 COMIENZA AQUÍ**

**Para quién:** Cualquier persona que abra el proyecto por primera vez

**Contenido:**
- Guía de inicio rápido
- "Elige tu camino" según objetivo
- Ruta rápida (semana por semana)
- Checklist de tareas

**Cuándo leer:** **AHORA MISMO** (si es tu primera vez)

---

### 📘 `README.md`
**Guía principal del proyecto**

**Para quién:** Desarrolladores y usuarios técnicos

**Contenido:**
- Características del sitio
- Requisitos (Node.js)
- Instrucciones de instalación
- Estructura del proyecto
- Temas disponibles
- Secciones de la página
- Cómo personalizar
- Cómo desplegar

**Cuándo leer:** Para entender el proyecto de forma general

---

### 📘 `RESUMEN-EJECUTIVO.md`
**Visión 360° del proyecto**

**Para quién:** Toma de decisiones, gerencia, overview completo

**Contenido:**
- Qué se ha construido
- Stack tecnológico
- Archivos del proyecto
- Branding aplicado
- Cómo empezar
- Personalización rápida
- Plan de marketing (resumen)
- Manual de operación (resumen)
- Contrato (resumen)
- KPIs y métricas
- Checklist de lanzamiento

**Cuándo leer:** Para tener una visión completa de todo

---

### 🛠️ `INSTRUCCIONES-INSTALACION.md`
**Cómo instalar y correr el proyecto**

**Para quién:** Usuarios sin Node.js instalado, primera instalación

**Contenido:**
- Qué es Node.js y por qué se necesita
- Cómo instalar Node.js paso a paso
- Cómo verificar la instalación
- Cómo ejecutar el proyecto
- Troubleshooting (solución de errores comunes)
- Cómo desplegar a producción

**Cuándo leer:** Antes de `npm install`, si no tienes Node.js

---

### 🛠️ `DOCUMENTACION-TECNICA.md`
**Arquitectura y personalización avanzada**

**Para quién:** Desarrolladores, usuarios técnicos

**Contenido:**
- Stack tecnológico (¿por qué Next.js, TypeScript, Tailwind?)
- Sistema de temas (cómo funciona con CSS variables)
- Estructura de archivos detallada
- Componentes de la página
- Paletas de colores (4 temas)
- Personalización común (WhatsApp, Maps, logo, fuentes)
- Build y deploy
- Seguridad y privacidad
- Analytics y SEO
- Debugging

**Cuándo leer:** Para entender cómo funciona el código

---

### 🛠️ `CONFIGURACION-PERSONALIZADA.md`
**Guía rápida de personalización**

**Para quién:** Usuarios no técnicos que quieren personalizar contenido

**Contenido:**
- Cómo cambiar WhatsApp
- Cómo agregar información del doctor
- Cómo actualizar contacto (correo, teléfono, dirección)
- Cómo agregar Google Maps
- Cómo cambiar precios
- Cómo actualizar testimonios
- Cómo agregar logo
- Cómo cambiar tema por defecto
- Checklist de personalización

**Cuándo leer:** Cuando quieras personalizar sin tocar mucho código

---

### 🏥 `MANUAL-OPERACION.md`
**Manual operativo de la clínica**

**Para quién:** Staff de la clínica, médico, asistente

**Contenido:**
- Misión, visión, valores
- Flujo de atención (paciente nuevo + seguimiento)
- Expediente médico
- Políticas operativas (agendamiento, pago, cancelaciones)
- Scripts de comunicación (confirmación, solicitud de labs, etc.)
- Manejo de situaciones comunes
- KPIs operativos

**Cuándo leer:** Para configurar la operación de la clínica

---

### 🏥 `CONTRATO-CONSENTIMIENTO.md`
**Plantilla de contrato médico**

**Para quién:** Médico, abogado, administrador

**Contenido:**
- Contrato de prestación de servicios médicos
- Datos del médico y paciente
- Objeto del contrato
- Alcance y limitaciones (NO urgencias)
- Obligaciones de ambas partes
- Políticas de agendamiento y pago
- Consentimiento informado
- Riesgos y efectos adversos
- Privacidad (LFPDPPP México)
- Firmas

**⚠️ IMPORTANTE:** Revisar con abogado antes de usar

**Cuándo leer:** Antes de atender al primer paciente

---

### 📈 `PLAN-MARKETING.md`
**Estrategia completa de marketing**

**Para quién:** Marketing, redes sociales, médico

**Contenido:**
- Objetivo y público objetivo
- Canales principales (Instagram, GMB, Facebook, LinkedIn)
- Tipos de contenido
- Hashtags
- Calendario de contenido (30 días completo)
- Campañas de Ads (Facebook, Instagram, Google)
- Alianzas estratégicas
- Charlas presenciales
- Lead magnets
- Email marketing
- Programa de referidos
- KPIs de marketing

**Cuándo leer:** Para planear la estrategia de marketing

---

## 🎯 ¿Qué Archivo Leer Según Tu Objetivo?

| Tu objetivo es... | Lee este archivo |
|-------------------|------------------|
| Ver el sitio funcionando | `INSTRUCCIONES-INSTALACION.md` |
| Cambiar textos/contenido | `CONFIGURACION-PERSONALIZADA.md` |
| Entender el código | `DOCUMENTACION-TECNICA.md` |
| Configurar la operación | `MANUAL-OPERACION.md` |
| Planear el marketing | `PLAN-MARKETING.md` |
| Preparar contrato | `CONTRATO-CONSENTIMIENTO.md` |
| Visión completa | `RESUMEN-EJECUTIVO.md` |
| **Primera vez** | **`EMPIEZA-AQUI.md`** 👈 |

---

## 📊 Tamaño del Proyecto

| Tipo | Cantidad | Detalle |
|------|----------|---------|
| **Archivos de código** | 9 | TypeScript, JavaScript, CSS |
| **Archivos de config** | 6 | JSON, JS (configuración) |
| **Documentos** | 9 | Markdown (.md) |
| **Total** | 24 archivos | + carpetas |

**Líneas de código (aprox):** ~1,200 líneas  
**Palabras en documentación:** ~30,000 palabras  
**Tiempo de lectura completa:** ~2–3 horas

---

## 🔄 Flujo de Trabajo Recomendado

### 1️⃣ Primera vez (Día 1)
```
EMPIEZA-AQUI.md
    ↓
INSTRUCCIONES-INSTALACION.md
    ↓
Instalar Node.js
    ↓
npm install
    ↓
npm run dev
    ↓
Ver sitio en http://localhost:3000
```

### 2️⃣ Personalización (Días 2–5)
```
CONFIGURACION-PERSONALIZADA.md
    ↓
Editar app/page.tsx
    ↓
Cambiar WhatsApp, doctor, contacto
    ↓
Agregar fotos/logo
    ↓
Probar cambios en localhost
```

### 3️⃣ Operación (Semana 2)
```
MANUAL-OPERACION.md
    ↓
CONTRATO-CONSENTIMIENTO.md
    ↓
Revisar con abogado
    ↓
Configurar expediente digital
    ↓
Capacitar al equipo
```

### 4️⃣ Marketing (Semana 3–4)
```
PLAN-MARKETING.md
    ↓
Crear perfiles sociales
    ↓
Configurar Google My Business
    ↓
Preparar contenido (calendario 30 días)
    ↓
Iniciar publicaciones
```

### 5️⃣ Deploy (Semana 5)
```
DOCUMENTACION-TECNICA.md (sección Deploy)
    ↓
Comprar dominio
    ↓
Desplegar en Vercel
    ↓
Configurar DNS
    ↓
Instalar Analytics
```

---

## ✅ Archivos Críticos (No Eliminar)

### ⚠️ Obligatorios para que funcione:
- `app/globals.css`
- `app/layout.tsx`
- `app/page.tsx`
- `components/theme/ThemeProvider.tsx`
- `components/theme/ThemeSwitcher.tsx`
- `package.json`
- `tsconfig.json`
- `tailwind.config.ts`
- `next.config.js`

### ℹ️ Importantes (recomendado):
- Todos los archivos `.md` (documentación)
- `.eslintrc.json`
- `.gitignore`

### ✏️ Opcionales (puedes editar/eliminar):
- `README.md` (si tienes tu propia documentación)
- Archivos `.md` que no uses

---

## 🎨 Archivos por Personalizar

### 🔧 Obligatorio personalizar:
- `app/page.tsx` → WhatsApp, doctor, contacto, precios

### 🎨 Recomendado personalizar:
- `app/layout.tsx` → Metadata (SEO)
- `components/theme/ThemeProvider.tsx` → Tema por defecto

### 📁 Archivos a crear:
- `public/logo.svg` → Logo de la clínica
- `public/doctor.jpg` → Foto del doctor
- `app/favicon.ico` → Ícono del sitio

---

## 🚀 Próximo Paso

1. **Lee:** `EMPIEZA-AQUI.md`
2. **Sigue:** Las instrucciones paso a paso
3. **Personaliza:** Con `CONFIGURACION-PERSONALIZADA.md`
4. **Lanza:** Con `PLAN-MARKETING.md`

---

**Thrive Formative** — Estructura del Proyecto  
Todo organizado y documentado para tu éxito. 📂✅
