ALTER TABLE patients
  ADD COLUMN profile_photo_url text;

COMMENT ON COLUMN patients.profile_photo_url IS 'URL o ruta pública de la foto de perfil del paciente';
