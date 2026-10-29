-- Manual SQL script para regenerar identificadores de pacientes
-- Este script puede ejecutarse directamente en la base de datos de producción

-- Función auxiliar para normalizar texto
CREATE OR REPLACE FUNCTION normalize_name_part(text_input TEXT) RETURNS TEXT AS $$
BEGIN
  IF text_input IS NULL OR trim(text_input) = '' THEN
    RETURN NULL;
  END IF;
  
  RETURN upper(
    regexp_replace(
      translate(
        unaccent(replace(replace(text_input, 'Ñ', 'N'), 'ñ', 'N')),
        ' -''', ''
      ),
      '[^A-Z]', '', 'g'
    )
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Función para obtener primera letra o 'X'
CREATE OR REPLACE FUNCTION first_letter_or_x(text_input TEXT) RETURNS CHAR(1) AS $$
DECLARE
  normalized TEXT;
BEGIN
  normalized := normalize_name_part(text_input);
  IF normalized IS NULL OR length(normalized) = 0 THEN
    RETURN 'X';
  END IF;
  RETURN substring(normalized, 1, 1);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Función para generar el identificador completo
CREATE OR REPLACE FUNCTION generate_patient_identifier(
  p_first_name TEXT,
  p_middle_name TEXT,
  p_last_name TEXT,
  p_paternal_surname TEXT,
  p_maternal_surname TEXT,
  p_birth_date DATE
) RETURNS TEXT AS $$
DECLARE
  first_name_parsed TEXT;
  middle_name_parsed TEXT;
  paternal_parsed TEXT;
  maternal_parsed TEXT;
  n CHAR(1);
  sn CHAR(1);
  a CHAR(1);
  sa CHAR(1);
  date_part TEXT;
BEGIN
  -- Parsear primer y segundo nombre si están juntos
  IF p_first_name IS NOT NULL AND position(' ' in trim(p_first_name)) > 0 AND (p_middle_name IS NULL OR trim(p_middle_name) = '') THEN
    first_name_parsed := split_part(trim(p_first_name), ' ', 1);
    middle_name_parsed := substring(trim(p_first_name) from position(' ' in trim(p_first_name)) + 1);
  ELSE
    first_name_parsed := p_first_name;
    middle_name_parsed := p_middle_name;
  END IF;
  
  -- Parsear apellidos si están juntos
  IF p_paternal_surname IS NOT NULL THEN
    paternal_parsed := p_paternal_surname;
    maternal_parsed := p_maternal_surname;
  ELSIF p_last_name IS NOT NULL AND position(' ' in trim(p_last_name)) > 0 THEN
    paternal_parsed := split_part(trim(p_last_name), ' ', 1);
    IF p_maternal_surname IS NULL OR trim(p_maternal_surname) = '' THEN
      maternal_parsed := split_part(trim(p_last_name), ' ', 2);
    ELSE
      maternal_parsed := p_maternal_surname;
    END IF;
  ELSE
    paternal_parsed := COALESCE(p_paternal_surname, p_last_name);
    maternal_parsed := p_maternal_surname;
  END IF;
  
  -- Obtener primeras letras
  n := first_letter_or_x(first_name_parsed);
  sn := first_letter_or_x(middle_name_parsed);
  a := first_letter_or_x(paternal_parsed);
  sa := first_letter_or_x(maternal_parsed);
  
  -- Formatear fecha MMDDYY
  date_part := to_char(p_birth_date, 'MMDDYY');
  
  RETURN n || sn || a || sa || date_part;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Vista previa de identificadores que se generarían (DRY RUN)
-- Ejecuta esto primero para ver qué se generaría:
SELECT 
  client_code,
  first_name,
  middle_name,
  last_name,
  paternal_surname,
  maternal_surname,
  birth_date,
  generate_patient_identifier(
    first_name, 
    middle_name, 
    last_name, 
    paternal_surname, 
    maternal_surname, 
    birth_date
  ) AS new_identifier,
  patient_identifier AS current_identifier
FROM patients
WHERE deleted_at IS NULL
  AND birth_date IS NOT NULL
  AND first_name IS NOT NULL
  AND (paternal_surname IS NOT NULL OR last_name IS NOT NULL)
  AND (patient_identifier IS NULL OR patient_identifier = '')
ORDER BY created_at;

-- Una vez verificado, ejecutar el UPDATE para regenerar identificadores:
-- ADVERTENCIA: Esto actualizará la base de datos. Ejecuta el SELECT anterior primero.

/*
UPDATE patients
SET patient_identifier = generate_patient_identifier(
  first_name, 
  middle_name, 
  last_name, 
  paternal_surname, 
  maternal_surname, 
  birth_date
)
WHERE deleted_at IS NULL
  AND birth_date IS NOT NULL
  AND first_name IS NOT NULL
  AND (paternal_surname IS NOT NULL OR last_name IS NOT NULL)
  AND (patient_identifier IS NULL OR patient_identifier = '');
*/

-- Para regenerar un paciente específico (Jose Roel Maldonado, TF-00013):
/*
UPDATE patients
SET patient_identifier = generate_patient_identifier(
  first_name, 
  middle_name, 
  last_name, 
  paternal_surname, 
  maternal_surname, 
  birth_date
)
WHERE client_code = 'TF-00013'
  AND deleted_at IS NULL;
*/

-- Verificar resultado para TF-00013:
/*
SELECT 
  client_code,
  patient_identifier,
  first_name,
  middle_name,
  last_name,
  paternal_surname,
  maternal_surname,
  birth_date
FROM patients
WHERE client_code = 'TF-00013';
*/

-- Limpiar funciones auxiliares después de usar (opcional):
/*
DROP FUNCTION IF EXISTS generate_patient_identifier(TEXT, TEXT, TEXT, TEXT, TEXT, DATE);
DROP FUNCTION IF EXISTS first_letter_or_x(TEXT);
DROP FUNCTION IF EXISTS normalize_name_part(TEXT);
*/
