-- Thrive Formative: campos extendidos del perfil
-- Ejecutar en Supabase SQL Editor: https://supabase.com/dashboard/project/TU_PROJECT_REF/sql

alter table public.profiles
  add column if not exists birth_date date,
  add column if not exists age integer,
  add column if not exists contact_preference text,
  add column if not exists address text,
  add column if not exists sex text,
  add column if not exists referral_source text,
  add column if not exists referral_source_other text;

