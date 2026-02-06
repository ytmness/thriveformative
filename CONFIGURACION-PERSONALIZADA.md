# ⚙️ Configuración Personalizada - Thrive Formative

Este documento te guía para personalizar rápidamente la página web con tu información real.

---

## 📱 1. WhatsApp

### Ubicación
`app/page.tsx` — línea 4

### Cómo cambiar

```typescript
// ANTES:
const WHATSAPP_LINK = "https://wa.me/521XXXXXXXXXX?text=Hola%20quiero%20agendar%20una%20consulta%20inicial%20en%20Thrive%20Formative";

// DESPUÉS (ejemplo):
const WHATSAPP_LINK = "https://wa.me/5218112345678?text=Hola%20quiero%20agendar%20una%20consulta%20inicial%20en%20Thrive%20Formative";
```

### Formato del número
- **Incluye código de país** sin el `+`
- **Sin espacios, guiones o paréntesis**
- **Ejemplos:**
  - México (Monterrey): `5218112345678`
  - USA: `15551234567`
  - España: `34612345678`

### Personalizar el mensaje predefinido

Edita la parte después de `text=`:

```typescript
const WHATSAPP_LINK = "https://wa.me/5218112345678?text=Hola%2C%20me%20interesa%20agendar%20una%20consulta%20de%20medicina%20funcional";
```

**Nota:** Usa `%20` para espacios y `%2C` para comas.

---

## 👨‍⚕️ 2. Información del Doctor

### Ubicación
`app/page.tsx` — sección con `id="doctor"`

### Cómo cambiar

```tsx
// ANTES:
<div className="font-semibold">Dr. __________________</div>
<div className="text-muted">Medicina familiar y funcional • 28 años de experiencia</div>

// DESPUÉS (ejemplo):
<div className="font-semibold">Dr. Juan Pérez Hernández</div>
<div className="text-muted">Medicina familiar y funcional • Cédula profesional 1234567</div>
```

### Agregar foto del doctor

**Paso 1:** Guarda la foto en `public/doctor.jpg`

**Paso 2:** Reemplaza el placeholder:

```tsx
// ANTES:
<div className="h-56 rounded-xl bg-[rgb(var(--bg)/0.7)] border border-theme flex items-center justify-center text-muted text-sm">
  Foto del doctor (placeholder)
</div>

// DESPUÉS:
<img 
  src="/doctor.jpg" 
  alt="Dr. Juan Pérez" 
  className="h-56 w-full object-cover rounded-xl border border-theme"
/>
```

### Actualizar enfoque clínico

Edita el texto en la sección:

```tsx
<p className="mt-3 text-sm text-muted leading-relaxed">
  [Aquí tu descripción personalizada del enfoque clínico]
</p>
```

---

## 📞 3. Datos de Contacto

### Ubicación
`app/page.tsx` — sección con `id="contacto"`

### Correo electrónico

```tsx
// ANTES:
<div className="text-muted">correo@thriveformative.com (placeholder)</div>

// DESPUÉS:
<div className="text-muted">contacto@tuclinica.com</div>
```

### Teléfono

```tsx
// ANTES:
<div className="text-muted">+52 ___ ___ ____ (placeholder)</div>

// DESPUÉS:
<div className="text-muted">+52 (81) 1234-5678</div>
```

### Dirección física

Agrega debajo del teléfono:

```tsx
<div className="mt-4 text-sm">
  <div className="font-semibold">Dirección</div>
  <div className="text-muted">
    Av. Ricardo Margáin 444, Piso 3<br/>
    Santa Engracia, San Pedro Garza García<br/>
    Nuevo León, México 66267
  </div>
</div>
```

---

## 🗺️ 4. Google Maps

### Paso 1: Obtener código embed

1. Ve a [Google Maps](https://www.google.com/maps)
2. Busca tu dirección
3. Click en "Share" (Compartir)
4. Click en "Embed a map"
5. Copia el código `<iframe>...</iframe>`

### Paso 2: Pegar en el sitio

**Ubicación:** `app/page.tsx` — sección `#contacto`

```tsx
// ANTES:
<div className="mt-4 h-64 rounded-xl bg-[rgb(var(--bg)/0.7)] border border-theme flex items-center justify-center text-muted text-sm">
  Google Maps embed / dirección (placeholder)
</div>

// DESPUÉS:
<iframe
  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3596...."
  width="100%"
  height="256"
  style={{ border: 0, borderRadius: "0.75rem" }}
  allowFullScreen
  loading="lazy"
  referrerPolicy="no-referrer-when-downgrade"
  className="border border-theme"
/>
```

---

## 💰 5. Precios de Planes

### Ubicación
`app/page.tsx` — sección con `id="planes"`

### Cómo cambiar

```tsx
// ANTES:
<Plan name="Base" items={["Consulta inicial", "Plan escrito", "Seguimiento mensual"]} />

// DESPUÉS (con precio):
<Plan 
  name="Base" 
  price="$1,500 MXN"
  items={["Consulta inicial", "Plan escrito", "Seguimiento mensual"]} 
/>
```

### Actualizar componente Plan

Edita la función `Plan` en `app/page.tsx`:

```tsx
function Plan({ 
  name, 
  price,
  items, 
  featured 
}: { 
  name: string; 
  price?: string;
  items: string[]; 
  featured?: boolean 
}) {
  return (
    <div className={`bg-surface border rounded-2xl shadow-soft p-6 ${featured ? "border-theme ring-2 ring-theme" : "border-theme"}`}>
      <div className="font-display tracking-wide">{name}</div>
      
      {price && (
        <div className="mt-2 text-2xl font-semibold text-[rgb(var(--primary))]">
          {price}
        </div>
      )}
      
      <ul className="mt-3 space-y-2 text-sm text-muted">
        {items.map((x) => <li key={x}>• {x}</li>)}
      </ul>
      
      <button className={`mt-5 w-full rounded-xl px-4 py-3 text-sm font-semibold ${featured ? "btn-primary" : "btn-outline"}`}>
        Elegir
      </button>
    </div>
  );
}
```

---

## 🗣️ 6. Testimonios

### Ubicación
`app/page.tsx` — sección de testimonios

### Cómo cambiar

```tsx
// ANTES:
<Quote text="Me ayudó a entender mis laboratorios y por fin tuve un plan claro." />

// DESPUÉS (con nombre):
<Quote 
  text="Me ayudó a entender mis laboratorios y por fin tuve un plan claro." 
  author="María G."
  location="San Pedro"
/>
```

### Actualizar componente Quote

```tsx
function Quote({ 
  text, 
  author, 
  location 
}: { 
  text: string; 
  author?: string;
  location?: string;
}) {
  return (
    <div className="bg-surface border border-theme rounded-2xl shadow-soft p-6">
      <p className="text-sm leading-relaxed">"{text}"</p>
      <div className="text-xs text-muted mt-3">
        {author && <span className="font-semibold">{author}</span>}
        {author && location && " • "}
        {location}
      </div>
    </div>
  );
}
```

---

## 🎨 7. Logo y Branding

### Agregar logo en el header

**Paso 1:** Guarda tu logo en `public/logo.svg` o `public/logo.png`

**Paso 2:** Edita el header en `app/page.tsx`:

```tsx
// ANTES:
<div className="font-display tracking-[0.18em] text-sm">
  THRIVE FORMATIVE
  <div className="text-xs text-muted tracking-[0.22em]">WELLNESS FROM WITHIN</div>
</div>

// DESPUÉS:
<div className="flex items-center gap-3">
  <img src="/logo.svg" alt="Thrive Formative" className="h-10" />
  <div>
    <div className="font-display tracking-[0.18em] text-sm">THRIVE FORMATIVE</div>
    <div className="text-xs text-muted tracking-[0.22em]">WELLNESS FROM WITHIN</div>
  </div>
</div>
```

### Favicon

**Paso 1:** Convierte tu logo a `.ico` en https://favicon.io/

**Paso 2:** Guarda como `app/favicon.ico` (reemplaza el default)

---

## 🌈 8. Tema por Defecto

Si quieres que el sitio cargue con un tema específico:

### Ubicación
`components/theme/ThemeProvider.tsx` — línea 17

```tsx
// ANTES (Golden Sand por defecto):
const [theme, setTheme] = React.useState<ThemeId>("golden-sand");

// Opciones:
// "golden-sand"   → Cálido, premium
// "nocturnal"     → Oscuro, elegante
// "metals"        → Metálico, boutique
// "earth-modern"  → Tierra, contemporáneo

// DESPUÉS (ejemplo con Nocturnal):
const [theme, setTheme] = React.useState<ThemeId>("nocturnal");
```

---

## 📝 9. Textos Clave

### Título principal (Hero)

**Ubicación:** `app/page.tsx` — sección `#inicio`

```tsx
<h1 className="font-display text-4xl md:text-5xl leading-tight tracking-wide">
  Salud personalizada para vivir más y mejor.
</h1>
```

### Subtítulo (Hero)

```tsx
<p className="mt-4 text-muted text-base leading-relaxed">
  Atención médica con enfoque de medicina familiar y funcional: prevención, acompañamiento continuo
  y planes basados en evidencia.
</p>
```

### Meta description (SEO)

**Ubicación:** `app/layout.tsx`

```tsx
export const metadata: Metadata = {
  title: "Thrive Formative — Wellness from Within",
  description: "Medicina familiar y funcional, atención personalizada basada en evidencia.",
};
```

---

## ✅ Checklist de Personalización

Usa esta lista para asegurarte de personalizar todo:

- [ ] Número de WhatsApp (`app/page.tsx` línea 4)
- [ ] Nombre del doctor (sección `#doctor`)
- [ ] Foto del doctor (`public/doctor.jpg`)
- [ ] Correo electrónico (sección `#contacto`)
- [ ] Teléfono (sección `#contacto`)
- [ ] Dirección física (sección `#contacto`)
- [ ] Google Maps embed (sección `#contacto`)
- [ ] Precios de planes (sección `#planes`)
- [ ] Testimonios reales (sección de testimonios)
- [ ] Logo (`public/logo.svg`)
- [ ] Favicon (`app/favicon.ico`)
- [ ] Tema por defecto (`components/theme/ThemeProvider.tsx`)
- [ ] Título y descripción SEO (`app/layout.tsx`)
- [ ] Textos del hero (sección `#inicio`)

---

## 🚀 Después de Personalizar

1. **Guarda todos los archivos**
2. **Reinicia el servidor de desarrollo:**
   ```bash
   # En la terminal (Ctrl+C para detener)
   npm run dev
   ```
3. **Refresca el navegador** (F5 o Ctrl+R)
4. **Revisa cada sección** para confirmar que todo se vea bien
5. **Prueba en móvil** (Chrome DevTools → Toggle device toolbar)

---

**¡Listo!** Tu sitio ahora está personalizado y listo para mostrar a pacientes. 🎉
