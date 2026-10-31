# Guía Visual: Editor de Notas Tipo Google Docs

## Vista 1: Lista de Notas del Plan de 90 Días

Esta es la vista inicial cuando el usuario navega a "Expediente > Plan de 90 días":

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│  Plan de 90 días                                       [+ Nueva nota]  │
│  ─────────────────────────────────────────────────────────────────────  │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │                                                                   │ │
│  │  Primera consulta inicial                                        │ │
│  │                                                                   │ │
│  │  Paciente presenta síntomas de fatiga crónica y dificultades     │ │
│  │  para mantener peso saludable. Historia familiar de...           │ │
│  │                                                                   │ │
│  │  15 de enero de 2024 • Firmada                                   │ │
│  │                                                                   │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │                                                                   │ │
│  │  Seguimiento semana 4                                            │ │
│  │                                                                   │ │
│  │  El paciente reporta mejoras significativas en niveles de        │ │
│  │  energía. Continúa adherencia al protocolo nutricional...        │ │
│  │                                                                   │ │
│  │  12 de febrero de 2024                                           │ │
│  │                                                                   │ │
│  │  [Eliminar]                                                      │ │
│  │                                                                   │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │                                                                   │ │
│  │  Nota sin título                                                 │ │
│  │                                                                   │ │
│  │  Borrador de evaluación intermedia                              │ │
│  │                                                                   │ │
│  │  1 de marzo de 2024                                              │ │
│  │                                                                   │ │
│  │  [Eliminar]                                                      │ │
│  │                                                                   │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Características de esta vista:
- ✅ Fondo suave (rgb(250,250,250))
- ✅ Tarjetas blancas con sombra sutil
- ✅ Título prominente de cada nota
- ✅ Preview de contenido (max 150 caracteres)
- ✅ Fecha de creación en formato legible
- ✅ Indicador "Firmada" para notas bloqueadas
- ✅ Hover effect: tarjeta se eleva ligeramente

---

## Vista 2: Editor de Nota (Vacío)

Al hacer click en "+ Nueva nota", se abre el editor:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│  [B] [I]  │  [H2] [H3]  │  [•] [1.]                                  │
│                                                                         │
│  ─────────────────────────────────────────────────────────────────────  │
│                                                                         │
│                                                                         │
│         ╔═══════════════════════════════════════════════════╗          │
│         ║                                                   ║          │
│         ║                                                   ║          │
│         ║                                                   ║          │
│         ║   Nota sin título                                ║          │
│         ║   ___________________________________________    ║          │
│         ║                                                   ║          │
│         ║   [Cursor parpadeando aquí]                     ║          │
│         ║                                                   ║          │
│         ║                                                   ║          │
│         ║                                                   ║          │
│         ║                                                   ║          │
│         ║                                                   ║          │
│         ║                                                   ║          │
│         ║                                                   ║          │
│         ║                                                   ║          │
│         ║                                                   ║          │
│         ║                                                   ║          │
│         ║                                                   ║          │
│         ║                                                   ║          │
│         ║                                                   ║          │
│         ║                                                   ║          │
│         ║                                                   ║          │
│         ║                                                   ║          │
│         ║                                                   ║          │
│         ║                                                   ║          │
│         ╚═══════════════════════════════════════════════════╝          │
│                                                                         │
│                                                                         │
│  ─────────────────────────────────────────────────────────────────────  │
│                                                    [Cancelar] [Guardar] │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Características del editor:
- ✅ Barra de herramientas sticky (siempre visible al scrollear)
- ✅ "Papel" blanco (max-width: 48rem, centrado)
- ✅ Márgenes amplios (4rem arriba/abajo, 5rem izq/der)
- ✅ Sombra sutil para efecto de profundidad
- ✅ Botones de formato con estados activos
- ✅ Input de título grande (2.25rem, serif)

---

## Vista 3: Editor con Contenido Rico

Ejemplo de una nota completamente formateada:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│  [B̲] [I]  │  [H̲2̲] [H3]  │  [•] [1.]                                  │
│  └─activo                                                               │
│  ─────────────────────────────────────────────────────────────────────  │
│                                                                         │
│                                                                         │
│         ╔═══════════════════════════════════════════════════╗          │
│         ║                                                   ║          │
│         ║                                                   ║          │
│         ║   Evaluación Seguimiento 8 Semanas               ║          │
│         ║   ___________________________________________    ║          │
│         ║                                                   ║          │
│         ║   Progreso General                               ║          │
│         ║                                                   ║          │
│         ║   El paciente muestra mejoras notables en        ║          │
│         ║   todos los indicadores clave:                   ║          │
│         ║                                                   ║          │
│         ║   Métricas Objetivas                             ║          │
│         ║                                                   ║          │
│         ║   • Peso corporal: -5.2 kg desde inicio          ║          │
│         ║   • Masa grasa: reducción de 3.1%                ║          │
│         ║   • Energía: reporta 8/10 vs 4/10 inicial        ║          │
│         ║   • Sueño: promedio 7.5h vs 5.2h inicial         ║          │
│         ║                                                   ║          │
│         ║   Adherencia al Protocolo                        ║          │
│         ║                                                   ║          │
│         ║   El cumplimiento ha sido excelente en:          ║          │
│         ║                                                   ║          │
│         ║   1. Suplementación diaria (95% adherencia)      ║          │
│         ║   2. Protocolo nutricional (90% adherencia)      ║          │
│         ║   3. Actividad física (4 sesiones/semana)        ║          │
│         ║                                                   ║          │
│         ║   Próximos Pasos                                 ║          │
│         ║                                                   ║          │
│         ║   • Mantener protocolo actual                    ║          │
│         ║   • Añadir ejercicio de fuerza                   ║          │
│         ║   • Seguimiento en 2 semanas                     ║          │
│         ║                                                   ║          │
│         ╚═══════════════════════════════════════════════════╝          │
│                                                                         │
│  ─────────────────────────────────────────────────────────────────────  │
│                                                    [Cancelar] [Guardar] │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Formato aplicado visible:
- **H2**: "Progreso General", "Adherencia al Protocolo", etc. (más grandes, serif)
- **H3**: "Métricas Objetivas", "Próximos Pasos" (medianos, serif)
- **Listas con viñetas**: Métricas y próximos pasos
- **Listas numeradas**: Protocolo de adherencia
- **Negrita**: Números y datos importantes (cuando el botón [B] está activo)

---

## Vista 4: Estados Interactivos

### Botón de Herramienta Normal
```
┌──────┐
│  B   │  ← Gris claro, hover: fondo más oscuro
└──────┘
```

### Botón de Herramienta Activo (texto seleccionado está en negrita)
```
┌──────┐
│  B   │  ← Fondo azul claro (rgb(230,240,255))
└──────┘     Borde azul, texto azul (rgb(26,115,232))
```

### Estado de Guardado
```
[Guardar]  ← Normal
[Guardando...]  ← Deshabilitado, muestra spinner/estado
```

---

## Vista 5: Responsive (Móvil)

En pantallas pequeñas (<960px), el diseño se adapta:

```
┌─────────────────────────┐
│ [B][I] [H2][H3] [•][1.] │
├─────────────────────────┤
│                         │
│  ╔═══════════════════╗  │
│  ║                   ║  │
│  ║  Título           ║  │
│  ║  _____________    ║  │
│  ║                   ║  │
│  ║  Contenido aquí   ║  │
│  ║  con márgenes     ║  │
│  ║  reducidos:       ║  │
│  ║  2rem en lugar    ║  │
│  ║  de 5rem          ║  │
│  ║                   ║  │
│  ╚═══════════════════╝  │
│                         │
├─────────────────────────┤
│    [Cancelar][Guardar]  │
└─────────────────────────┘
```

### Adaptaciones móviles:
- ✅ Márgenes reducidos (2rem → 1.5rem)
- ✅ Papel ocupa más ancho de pantalla
- ✅ Botones de herramienta más táctiles
- ✅ Título más pequeño (1.75rem vs 2.25rem)

---

## Flujo de Usuario Completo

### 1. Acceso
```
Admin Dashboard
   ↓
Pacientes
   ↓
[Click en paciente]
   ↓
Expediente (tab)
   ↓
Plan de 90 días (dropdown)
   ↓
LISTA DE NOTAS ★
```

### 2. Crear Nueva Nota
```
Lista de Notas
   ↓
[Click en "+ Nueva nota"]
   ↓
EDITOR (vacío) ★
   ↓
[Usuario escribe título]
   ↓
[Usuario escribe contenido]
   ↓
[Usuario aplica formato con toolbar]
   ↓
[Click en "Guardar" o espera 30s para autosave]
   ↓
Volver a LISTA DE NOTAS
   (nueva nota aparece arriba)
```

### 3. Editar Nota Existente
```
Lista de Notas
   ↓
[Click en tarjeta de nota]
   ↓
EDITOR (con contenido cargado) ★
   ↓
[Usuario edita]
   ↓
[Autosave cada 30s o guardar manual]
   ↓
[Click en "Cancelar" o terminar edición]
   ↓
Volver a LISTA DE NOTAS
```

### 4. Eliminar Nota
```
Lista de Notas
   ↓
[Click en "Eliminar" en tarjeta]
   ↓
[Confirmación: "¿Eliminar esta nota?"]
   ↓
[Aceptar]
   ↓
Nota desaparece de lista
(Solo notas sin firmar)
```

---

## Colores y Tipografía

### Paleta de Colores
```
Background:      rgb(250, 250, 250)  ← Gris muy claro
Paper:           rgb(255, 255, 255)  ← Blanco puro
Text:            rgb(30, 30, 30)     ← Casi negro
Muted:           rgb(180, 180, 180)  ← Gris medio
Border:          rgb(220, 220, 220)  ← Gris claro

Primary:         rgb(26, 115, 232)   ← Azul (botones activos)
Primary Light:   rgb(230, 240, 255)  ← Azul muy claro (hover)
```

### Tipografía
```
Título de nota:  2.25rem, serif, weight 600
H2 en editor:    1.75rem, serif, weight 600
H3 en editor:    1.35rem, serif, weight 600
Cuerpo:          1.05rem, sans-serif, line-height 1.65
Preview:         0.95rem, sans-serif, muted
```

---

## Especificaciones Técnicas

### Márgenes del Papel
```
Desktop (>960px):
  padding: 4rem 5rem;

Tablet (640px - 960px):
  padding: 3rem 2.5rem;

Móvil (<640px):
  padding: 2rem 1.5rem;
```

### Sombras
```
Barra herramientas:
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);

Papel:
  box-shadow: 0 1px 3px rgba(0,0,0,0.08);

Tarjeta hover:
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  transform: translateY(-1px);
```

### Transiciones
```
Todas las interacciones:
  transition: all 0.2s ease;
```

---

## Arquitectura de Datos

### Modelo de Nota
```typescript
{
  id: string;                    // UUID
  patient_id: string;            // FK a patients
  title: string | null;          // Título de la nota
  body_enc: Buffer | null;       // HTML encriptado
  note_type: string;             // "free", "soap", "addendum"
  author_id: string;             // FK a staff
  locked_at: Date | null;        // Firmada (no editable)
  signed_by: string | null;      // FK a staff
  created_at: Date;
}
```

### API Endpoints Utilizados
```
GET  /api/admin/patients/[id]/notes
  → Lista todas las notas del paciente

POST /api/admin/patients/[id]/notes
  Body: { title, body, noteType, lock }
  → Crea nueva nota

POST /api/admin/patients/[id]/notes
  Body: { id, title, body }
  → Actualiza nota existente (si id está presente)

DELETE /api/admin/patients/[id]/notes
  Body: { id }
  → Elimina nota (solo sin firmar)
```

---

Esta guía visual proporciona una referencia completa de cómo se ve y funciona el nuevo editor de notas tipo Google Docs.
