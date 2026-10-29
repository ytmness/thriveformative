#!/usr/bin/env node
/**
 * Script de verificación para la generación de identificadores de pacientes.
 * 
 * Este script verifica que los identificadores se generen correctamente
 * según el formato de la clínica.
 * 
 * Uso:
 *   node scripts/verify-patient-identifiers.mjs
 */

// Copia de las funciones de generación para testing independiente
function normalize(text) {
  if (!text) return "";
  
  return text
    .replace(/Ñ/g, "N") // Ñ → N (antes de normalizar)
    .replace(/ñ/g, "N") // ñ → N (antes de normalizar)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Eliminar diacríticos
    .toUpperCase()
    .replace(/[^A-Z]/g, ""); // Solo letras A-Z
}

function firstLetter(text) {
  const normalized = normalize(text || "");
  return normalized.length > 0 ? normalized[0] : "X";
}

function formatBirthDate(birthDate) {
  const match = birthDate.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) throw new Error("Fecha de nacimiento inválida. Se espera formato YYYY-MM-DD.");
  
  const [, year, month, day] = match;
  const yy = year.slice(-2);
  
  return `${month}${day}${yy}`;
}

function generatePatientIdentifier(firstName, middleName, paternalSurname, maternalSurname, birthDate) {
  if (!firstName?.trim()) {
    throw new Error("El primer nombre es obligatorio para generar el identificador.");
  }
  if (!paternalSurname?.trim()) {
    throw new Error("El apellido paterno es obligatorio para generar el identificador.");
  }
  if (!birthDate) {
    throw new Error("La fecha de nacimiento es obligatoria para generar el identificador.");
  }
  
  const n = firstLetter(firstName);
  const sn = firstLetter(middleName);
  const a = firstLetter(paternalSurname);
  const sa = firstLetter(maternalSurname);
  const date = formatBirthDate(birthDate);
  
  return `${n}${sn}${a}${sa}${date}`;
}

// Test cases
const testCases = [
  {
    name: "Caso del staff (Hugo Gerardo Flores Castano)",
    input: {
      firstName: "Hugo",
      middleName: "Gerardo",
      paternalSurname: "Flores",
      maternalSurname: "Castano",
      birthDate: "1965-05-26"
    },
    expected: "HGFC052665"
  },
  {
    name: "Sin segundo nombre (María López García)",
    input: {
      firstName: "María",
      middleName: null,
      paternalSurname: "López",
      maternalSurname: "García",
      birthDate: "1990-12-31"
    },
    expected: "MXLG123190"
  },
  {
    name: "Sin apellido materno (José Rodríguez)",
    input: {
      firstName: "José",
      middleName: "Antonio",
      paternalSurname: "Rodríguez",
      maternalSurname: null,
      birthDate: "1985-01-01"
    },
    expected: "JARX010185"
  },
  {
    name: "Sin segundo nombre ni apellido materno",
    input: {
      firstName: "Ana",
      middleName: null,
      paternalSurname: "Martínez",
      maternalSurname: null,
      birthDate: "2000-07-15"
    },
    expected: "AXMX071500"
  },
  {
    name: "Con acentos (Andrés Pérez)",
    input: {
      firstName: "Andrés",
      middleName: "José",
      paternalSurname: "Pérez",
      maternalSurname: "Gómez",
      birthDate: "1975-03-20"
    },
    expected: "AJPG032075"
  },
  {
    name: "Con Ñ (Iñaki Muñoz)",
    input: {
      firstName: "Iñaki",
      middleName: null,
      paternalSurname: "Muñoz",
      maternalSurname: "Peña",
      birthDate: "1988-11-05"
    },
    expected: "IXMP110588"
  },
  {
    name: "Con espacios en nombres compuestos (José María De la Garza)",
    input: {
      firstName: "José María",
      middleName: null,
      paternalSurname: "De la Garza",
      maternalSurname: "Santos",
      birthDate: "1970-09-10"
    },
    expected: "JXDS091070"
  }
];

console.log("=== Verificación de Generación de Identificadores ===\n");

let passed = 0;
let failed = 0;

for (const testCase of testCases) {
  try {
    const result = generatePatientIdentifier(
      testCase.input.firstName,
      testCase.input.middleName,
      testCase.input.paternalSurname,
      testCase.input.maternalSurname,
      testCase.input.birthDate
    );
    
    if (result === testCase.expected) {
      console.log(`✅ ${testCase.name}`);
      console.log(`   Entrada: ${testCase.input.firstName} ${testCase.input.middleName || ""} ${testCase.input.paternalSurname} ${testCase.input.maternalSurname || ""} (${testCase.input.birthDate})`);
      console.log(`   Resultado: ${result}\n`);
      passed++;
    } else {
      console.log(`❌ ${testCase.name}`);
      console.log(`   Esperado: ${testCase.expected}`);
      console.log(`   Obtenido: ${result}\n`);
      failed++;
    }
  } catch (error) {
    console.log(`❌ ${testCase.name}`);
    console.log(`   Error: ${error.message}\n`);
    failed++;
  }
}

console.log("=== RESUMEN ===");
console.log(`✅ Pasaron: ${passed}/${testCases.length}`);
console.log(`❌ Fallaron: ${failed}/${testCases.length}`);

if (failed === 0) {
  console.log("\n🎉 Todos los tests pasaron correctamente!");
  process.exit(0);
} else {
  console.log("\n⚠️  Algunos tests fallaron. Revisa la implementación.");
  process.exit(1);
}
