/**
 * Generador de identificadores de pacientes según formato interno de la clínica.
 * 
 * Formato: {N}{SN}{A}{SA}{MM}{DD}{YY} (10 caracteres)
 * 
 * Ejemplo:
 *   Nombre: Hugo Gerardo Flores Castano
 *   Nacimiento: 1965-05-26
 *   ID: HGFC052665
 * 
 * Reglas:
 * - N = primera letra del primer nombre
 * - SN = primera letra del segundo nombre (o 'X' si falta)
 * - A = primera letra del apellido paterno
 * - SA = primera letra del apellido materno (o 'X' si falta)
 * - MMDDYY del nacimiento (mes, día, año 2 dígitos)
 * - Mayúsculas A-Z; acentos eliminados (Á→A, Ñ→N)
 * - Espacios, guiones, apóstrofes ignorados al tomar la inicial
 */

/**
 * Normaliza texto: elimina acentos, convierte a mayúsculas, remueve espacios/guiones/apóstrofes
 */
function normalize(text: string): string {
  if (!text) return "";
  
  return text
    .replace(/Ñ/g, "N") // Ñ → N (antes de normalizar)
    .replace(/ñ/g, "N") // ñ → N (antes de normalizar)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Eliminar diacríticos
    .toUpperCase()
    .replace(/[^A-Z]/g, ""); // Solo letras A-Z
}

/**
 * Obtiene la primera letra de un nombre normalizado, o 'X' si no existe
 */
function firstLetter(text: string | null | undefined): string {
  const normalized = normalize(text || "");
  return normalized.length > 0 ? normalized[0] : "X";
}

/**
 * Formatea fecha de nacimiento como MMDDYY
 */
function formatBirthDate(birthDate: string): string {
  // Esperamos formato ISO: YYYY-MM-DD
  const match = birthDate.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) throw new Error("Fecha de nacimiento inválida. Se espera formato YYYY-MM-DD.");
  
  const [, year, month, day] = match;
  const yy = year.slice(-2); // Últimos 2 dígitos del año
  
  return `${month}${day}${yy}`;
}

/**
 * Genera el identificador de paciente según formato de la clínica
 * 
 * @param firstName - Primer nombre del paciente
 * @param middleName - Segundo nombre (opcional)
 * @param paternalSurname - Apellido paterno
 * @param maternalSurname - Apellido materno (opcional)
 * @param birthDate - Fecha de nacimiento en formato YYYY-MM-DD
 * @returns Identificador de 10 caracteres (ej: HGFC052665)
 */
export function generatePatientIdentifier(
  firstName: string,
  middleName: string | null | undefined,
  paternalSurname: string,
  maternalSurname: string | null | undefined,
  birthDate: string
): string {
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

/**
 * Valida que un identificador tenga el formato correcto
 */
export function isValidPatientIdentifier(identifier: string): boolean {
  // Debe ser exactamente 10 caracteres: 4 letras + 6 dígitos
  return /^[A-Z]{4}\d{6}$/.test(identifier);
}
