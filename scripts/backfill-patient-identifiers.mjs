#!/usr/bin/env node
/**
 * Script de backfill para generar identificadores de pacientes existentes.
 * 
 * Este script:
 * 1. Busca todos los pacientes sin identificador que tengan los datos necesarios
 * 2. Genera el identificador según el formato de la clínica
 * 3. Maneja colisiones agregando sufijo del código TF
 * 
 * Uso:
 *   node scripts/backfill-patient-identifiers.mjs [--dry-run]
 */

import pg from "pg";

const { Client } = pg;

async function query(sql, params = []) {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });
  
  await client.connect();
  
  try {
    const result = await client.query(sql, params);
    return result;
  } finally {
    await client.end();
  }
}

/**
 * Normaliza texto: elimina acentos, convierte a mayúsculas, remueve espacios/guiones/apóstrofes
 */
function normalize(text) {
  if (!text) return "";
  
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Eliminar diacríticos
    .replace(/Ñ/gi, "N") // Ñ → N
    .toUpperCase()
    .replace(/[^A-Z]/g, ""); // Solo letras A-Z
}

/**
 * Obtiene la primera letra de un nombre normalizado, o 'X' si no existe
 */
function firstLetter(text) {
  const normalized = normalize(text || "");
  return normalized.length > 0 ? normalized[0] : "X";
}

/**
 * Formatea fecha de nacimiento como MMDDYY
 */
function formatBirthDate(birthDate) {
  // Esperamos formato ISO: YYYY-MM-DD
  const match = String(birthDate).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return null;
  
  const [, year, month, day] = match;
  const yy = year.slice(-2); // Últimos 2 dígitos del año
  
  return `${month}${day}${yy}`;
}

/**
 * Genera el identificador de paciente según formato de la clínica
 */
function generatePatientIdentifier(firstName, middleName, paternalSurname, maternalSurname, birthDate) {
  const n = firstLetter(firstName);
  const sn = firstLetter(middleName);
  const a = firstLetter(paternalSurname);
  const sa = firstLetter(maternalSurname);
  const date = formatBirthDate(birthDate);
  
  if (!date) return null;
  
  return `${n}${sn}${a}${sa}${date}`;
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  
  console.log("=== Backfill de identificadores de pacientes ===\n");
  
  if (dryRun) {
    console.log("🔍 MODO DRY-RUN: No se realizarán cambios en la base de datos\n");
  }
  
  // Obtener pacientes sin identificador que tengan datos suficientes
  const candidates = await query(`
    SELECT 
      id, 
      client_code,
      first_name, 
      middle_name, 
      last_name, 
      paternal_surname, 
      maternal_surname, 
      birth_date::text
    FROM patients
    WHERE deleted_at IS NULL
      AND patient_identifier IS NULL
      AND birth_date IS NOT NULL
      AND first_name IS NOT NULL
      AND (paternal_surname IS NOT NULL OR last_name IS NOT NULL)
    ORDER BY created_at ASC
  `);
  
  console.log(`📊 Total de pacientes sin identificador: ${candidates.rows.length}\n`);
  
  if (candidates.rows.length === 0) {
    console.log("✅ Todos los pacientes tienen identificador o les faltan datos necesarios.");
    return;
  }
  
  const results = {
    generated: 0,
    withCollisions: 0,
    skipped: 0,
    errors: []
  };
  
  // Mapa para rastrear colisiones
  const identifierCounts = new Map();
  
  for (const patient of candidates.rows) {
    const { 
      id, 
      client_code, 
      first_name, 
      middle_name, 
      last_name, 
      paternal_surname, 
      maternal_surname, 
      birth_date 
    } = patient;
    
    try {
      // Parsear nombres si están en un solo campo
      let firstName = first_name;
      let middleName = middle_name;
      
      // Si first_name contiene espacios, separar primer y segundo nombre
      if (first_name && first_name.includes(' ') && !middle_name) {
        const parts = first_name.trim().split(/\s+/);
        firstName = parts[0];
        middleName = parts.slice(1).join(' ');
      }
      
      // Parsear apellidos si están en un solo campo
      let apellidoPaterno = paternal_surname || last_name;
      let apellidoMaterno = maternal_surname;
      
      // Si last_name contiene espacios y no hay paternal_surname separado, tomar primer apellido
      if (last_name && last_name.includes(' ') && !paternal_surname) {
        const parts = last_name.trim().split(/\s+/);
        apellidoPaterno = parts[0];
        if (!maternal_surname && parts.length > 1) {
          apellidoMaterno = parts[1];
        }
      }
      
      let identifier = generatePatientIdentifier(
        firstName,
        middleName,
        apellidoPaterno,
        apellidoMaterno,
        birth_date
      );
      
      if (!identifier) {
        results.skipped++;
        console.log(`⚠️  Saltado ${client_code}: No se pudo generar identificador`);
        console.log(`   Datos: ${first_name} / ${last_name} / ${birth_date}`);
        continue;
      }
      
      // Verificar si ya existe este identificador en la BD
      const existing = await query(
        `SELECT id FROM patients WHERE patient_identifier = $1 AND id != $2 AND deleted_at IS NULL`,
        [identifier, id]
      );
      
      // Si existe colisión, agregar sufijo
      if (existing.rows.length > 0) {
        const suffix = client_code.replace("TF-", "").slice(-2);
        identifier = `${identifier.slice(0, 8)}-${suffix}`;
        results.withCollisions++;
        console.log(`🔄 Colisión detectada para ${client_code} → ${identifier}`);
      }
      
      // Registrar para detectar duplicados en este batch
      const count = identifierCounts.get(identifier) || 0;
      identifierCounts.set(identifier, count + 1);
      
      if (!dryRun) {
        await query(
          `UPDATE patients SET patient_identifier = $1 WHERE id = $2`,
          [identifier, id]
        );
      }
      
      results.generated++;
      const displayName = `${firstName}${middleName ? ' ' + middleName : ''} ${apellidoPaterno}${apellidoMaterno ? ' ' + apellidoMaterno : ''}`;
      console.log(`✅ ${client_code} → ${identifier} (${displayName})`);
      
    } catch (error) {
      results.errors.push({ client_code, error: error.message });
      console.error(`❌ Error en ${client_code}: ${error.message}`);
    }
  }
  
  // Verificar duplicados en el batch
  const duplicates = Array.from(identifierCounts.entries())
    .filter(([, count]) => count > 1)
    .map(([id]) => id);
  
  console.log("\n=== RESUMEN ===");
  console.log(`✅ Identificadores generados: ${results.generated}`);
  console.log(`🔄 Con resolución de colisión: ${results.withCollisions}`);
  console.log(`⚠️  Pacientes saltados: ${results.skipped}`);
  console.log(`❌ Errores: ${results.errors.length}`);
  
  if (duplicates.length > 0) {
    console.log(`\n⚠️  ADVERTENCIA: Se detectaron ${duplicates.length} identificadores duplicados en este batch:`);
    duplicates.forEach(id => console.log(`   - ${id}`));
  }
  
  if (results.errors.length > 0) {
    console.log("\n❌ Detalles de errores:");
    results.errors.forEach(({ client_code, error }) => {
      console.log(`   ${client_code}: ${error}`);
    });
  }
  
  if (dryRun) {
    console.log("\n🔍 Modo dry-run: No se realizaron cambios. Ejecuta sin --dry-run para aplicar.");
  }
}

main()
  .then(() => {
    console.log("\n✅ Script completado");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Error fatal:", error);
    process.exit(1);
  });
