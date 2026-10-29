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

**Nota:** El script ahora parsea automáticamente nombres compuestos en un solo campo. Por ejemplo:
- `first_name = "Jose Roel"` se separa en `Jose` (primer nombre) + `Roel` (segundo nombre)
- `last_name = "Maldonado Perez"` se separa en `Maldonado` (paterno) + `Perez` (materno)

### 3. Alternativa: SQL directo en producción

Si prefieres ejecutar SQL directamente en la base de datos (útil para producción):

```bash
psql $DATABASE_URL -f scripts/regenerate-patient-identifiers.sql
```

O ejecuta el script SQL manualmente:

1. **Vista previa (dry-run):** Ejecuta el `SELECT` en el script para ver qué se generaría
2. **Regenerar todos:** Descomenta y ejecuta el `UPDATE` principal
3. **Regenerar uno específico:** Usa el `UPDATE` con `WHERE client_code = 'TF-XXXXX'`

El script SQL incluye funciones PL/pgSQL que manejan el parsing automático de nombres compuestos.

### 4. Verificar

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
- **Parsing automático:** El backfill y el script SQL parsean automáticamente nombres compuestos en un solo campo
- **Estabilidad:** Una vez generado, el identificador no cambia aunque se edite nombre o fecha de nacimiento

## Troubleshooting

### Problema: El identificador no aparece en el resumen del paciente

**Síntomas:** En la ficha del paciente solo aparece `Código: TF-00013`, no el identificador (ej: `JRMX030671`)

**Causas posibles:**

1. **El identificador no se generó durante el backfill** porque el paciente tiene nombres compuestos en un solo campo
2. **El backend no está retornando el campo** `patient_identifier` en la respuesta API
3. **La migración no se aplicó** correctamente

**Solución:**

#### Opción A: Re-ejecutar el backfill mejorado

El script actualizado ahora parsea nombres compuestos:

```bash
node scripts/backfill-patient-identifiers.mjs --dry-run  # Ver qué se generará
node scripts/backfill-patient-identifiers.mjs            # Ejecutar
```

#### Opción B: SQL directo para un paciente específico

Para regenerar el identificador de un paciente específico (ej: TF-00013):

```sql
-- 1. Crear las funciones auxiliares (ejecutar una vez)
-- Ver scripts/regenerate-patient-identifiers.sql para el código completo

-- 2. Vista previa para TF-00013
SELECT 
  client_code,
  first_name,
  last_name,
  birth_date,
  generate_patient_identifier(
    first_name, middle_name, last_name,
    paternal_surname, maternal_surname, birth_date
  ) AS new_identifier
FROM patients
WHERE client_code = 'TF-00013';

-- 3. Actualizar
UPDATE patients
SET patient_identifier = generate_patient_identifier(
  first_name, middle_name, last_name,
  paternal_surname, maternal_surname, birth_date
)
WHERE client_code = 'TF-00013';
```

#### Opción C: Actualizar manualmente en la UI

1. Ir a la ficha del paciente
2. Editar → completar campos separados:
   - Si `first_name` es "Jose Roel", separar en:
     - Primer nombre: `Jose`
     - Segundo nombre: `Roel`
   - Si `last_name` es "Maldonado", poner:
     - Apellido paterno: `Maldonado`
3. Guardar → el identificador se generará automáticamente

### Problema: El identificador se generó pero no aparece en la UI

**Verificar en la base de datos:**

```sql
SELECT 
  client_code,
  patient_identifier,
  first_name,
  last_name,
  birth_date
FROM patients
WHERE client_code = 'TF-00013';
```

Si `patient_identifier` tiene un valor pero no aparece en la UI:

1. Verificar que el frontend esté actualizado (desplegar última versión)
2. Limpiar caché del navegador (Ctrl+F5)
3. Verificar que el API retorna el campo en `/api/admin/patients/{id}`

### Ejemplo de Caso Real: Jose Roel Maldonado (TF-00013)

**Datos en BD:**
- `first_name`: "Jose Roel" (nombres compuestos en un campo)
- `last_name`: "Maldonado"
- `birth_date`: 1971-03-06

**ID esperado:** `JRMX030671`
- J = Jose (primer nombre)
- R = Roel (segundo nombre, parseado del primer campo)
- M = Maldonado (apellido paterno)
- X = sin apellido materno
- 030671 = marzo 06, 1971

**Cómo regenerar:**

```bash
# Opción 1: Script Node.js
node scripts/backfill-patient-identifiers.mjs

# Opción 2: SQL directo
psql $DATABASE_URL -f scripts/regenerate-patient-identifiers.sql
```

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
