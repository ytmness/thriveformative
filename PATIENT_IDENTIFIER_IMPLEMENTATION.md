# Generación Automática de Identificadores de Pacientes

Este PR implementa la generación automática de identificadores de pacientes según el formato interno usado por la clínica Thrive Formative.

## Formato del Identificador

`{N}{SN}{A}{SA}{MM}{DD}{YY}` — 10 caracteres, mayúsculas, sin separadores.

**Ejemplo:**
- Nombre: Hugo Gerardo Flores Castano
- Fecha de nacimiento: 26 de mayo de 1965
- ID generado: `HGFC052665`

### Reglas de Generación

1. **N** = Primera letra del primer nombre
2. **SN** = Primera letra del segundo nombre (o `X` si falta)
3. **A** = Primera letra del apellido paterno
4. **SA** = Primera letra del apellido materno (o `X` si falta)
5. **MMDDYY** = Fecha de nacimiento (mes, día, año de 2 dígitos)

### Normalización

- Solo letras A-Z en mayúsculas
- Acentos eliminados: `Á→A`, `É→E`, `Í→I`, `Ó→O`, `Ú→U`, `Ñ→N`
- Espacios, guiones y apóstrofes ignorados al tomar la inicial

## Cambios Implementados

### 1. Base de Datos

**Nueva migración:** `db/migrations/0037_patient_identifier.sql`

- Agrega columna `patient_identifier` (text, nullable)
- Índice único para evitar duplicados
- Índice GIN trigram para búsqueda rápida

### 2. Backend

**Nuevo archivo:** `lib/domain/patientIdentifier.ts`

Funciones de utilidad:
- `generatePatientIdentifier()` — Genera el identificador según el formato
- `isValidPatientIdentifier()` — Valida formato del identificador

**Modificado:** `lib/domain/patients.ts`

- Agregados campos al tipo `PatientInput`:
  - `middleName` (segundo nombre)
  - `paternalSurname` (apellido paterno)
  - `maternalSurname` (apellido materno)
- Función `createPatient()` ahora genera automáticamente el identificador
- Búsqueda actualizada para incluir `patient_identifier`
- Función `mapPatient()` retorna el identificador en los resultados

### 3. Frontend

**Modificado:** `components/admin/patients/PatientScreens.tsx`

- Formulario de "Nuevo paciente" incluye:
  - Campo "Segundo nombre"
  - Campo "Apellido paterno" (usado para ID)
  - Campo "Apellido materno" (usado para ID)
  - Placeholder en fecha de nacimiento indicando que es requerida para ID
- Validación: Si hay fecha de nacimiento, requiere apellido paterno
- Lista de pacientes muestra el identificador en lugar del código `TF-#####`
- Resumen del paciente muestra el identificador
- Búsqueda actualizada para buscar por identificador

### 4. Script de Backfill

**Nuevo archivo:** `scripts/backfill-patient-identifiers.mjs`

Script para generar identificadores para pacientes existentes.

**Uso:**

```bash
# Modo dry-run (ver qué se generaría sin hacer cambios)
node scripts/backfill-patient-identifiers.mjs --dry-run

# Ejecutar el backfill
node scripts/backfill-patient-identifiers.mjs
```

El script:
- Busca pacientes sin identificador que tengan nombre, apellido y fecha de nacimiento
- Genera el identificador según el formato
- Detecta y resuelve colisiones agregando sufijo del código `TF-#####`
- Reporta estadísticas al finalizar

## Comportamiento

### Pacientes Nuevos

Al crear un paciente con los datos completos (nombre, apellidos, fecha de nacimiento), el sistema:

1. Genera automáticamente el identificador
2. Verifica si ya existe
3. Si hay colisión, agrega sufijo de los últimos 2 dígitos del código `TF-#####`
4. Guarda el identificador en `patient_identifier`

### Pacientes Existentes

El código `TF-#####` se mantiene en `client_code`. El nuevo identificador se genera:

- Automáticamente al crear/editar si hay datos completos
- Mediante el script de backfill para pacientes existentes

### Estabilidad

Una vez generado, el identificador **no cambia** aunque se editen nombre o fecha de nacimiento (estabilidad del identificador clínico).

## Migración y Despliegue

### 1. Aplicar migración de base de datos

```bash
node scripts/migrate.mjs
```

Esto agrega la columna `patient_identifier` a la tabla `patients`.

### 2. Ejecutar backfill (opcional pero recomendado)

Primero en modo dry-run para verificar:

```bash
node scripts/backfill-patient-identifiers.mjs --dry-run
```

Luego ejecutar el backfill:

```bash
node scripts/backfill-patient-identifiers.mjs
```

### 3. Verificar

- Los nuevos pacientes creados después del despliegue tendrán identificador automático
- Los pacientes existentes con datos completos tendrán identificador después del backfill
- Los pacientes sin fecha de nacimiento o apellidos no tendrán identificador (se puede generar más adelante al completar los datos)

## Búsqueda

El identificador está incluido en:

- Búsqueda de texto completo (nombre, código, **identificador**, email, teléfono)
- Índice GIN trigram para búsqueda rápida
- Mostrado prominentemente en la lista y en el resumen del paciente

**Ejemplo de búsqueda:**
- Buscar `HGFC052665` → Encuentra al paciente Hugo Gerardo Flores Castano

## Notas Técnicas

- **HIPAA-minded:** El identificador no contiene información sensible directa, solo iniciales y fecha pública
- **Colisiones:** Muy raras (4 letras + 6 dígitos = alta entropía), pero manejadas automáticamente
- **Retrocompatibilidad:** El código `TF-#####` se mantiene para sistemas legacy
- **Campos legacy:** `first_name` y `last_name` se mantienen por compatibilidad; los nuevos campos `paternal_surname` y `maternal_surname` se usan para el ID

## Testing

Para verificar la generación del identificador:

### 1. Ejecutar el script de verificación

```bash
node scripts/verify-patient-identifiers.mjs
```

Este script ejecuta 7 casos de prueba incluyendo casos extremos con acentos, Ñ, y nombres compuestos.

### 2. Prueba manual en la UI

1. Crear un paciente de prueba:
   - Primer nombre: `Hugo`
   - Segundo nombre: `Gerardo`
   - Apellido paterno: `Flores`
   - Apellido materno: `Castano`
   - Fecha de nacimiento: `1965-05-26`

2. Verificar que se genera: `HGFC052665`

3. Buscar por ese identificador en el directorio de pacientes

4. Verificar que aparece en el resumen del paciente

### Casos de Prueba Incluidos

El script de verificación incluye los siguientes casos:

| Caso | Entrada | ID Esperado |
|------|---------|-------------|
| Caso del staff | Hugo Gerardo Flores Castano (1965-05-26) | `HGFC052665` |
| Sin segundo nombre | María López García (1990-12-31) | `MXLG123190` |
| Sin apellido materno | José Antonio Rodríguez (1985-01-01) | `JARX010185` |
| Sin 2° nombre ni ap. materno | Ana Martínez (2000-07-15) | `AXMX071500` |
| Con acentos | Andrés José Pérez Gómez (1975-03-20) | `AJPG032075` |
| Con Ñ | Iñaki Muñoz Peña (1988-11-05) | `IXMP110588` |
| Nombres compuestos | José María De la Garza Santos (1970-09-10) | `JXDS091070` |
