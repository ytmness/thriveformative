-- Thrive Formative: roles admin y cliente en profiles
-- Ejecutar en Supabase SQL Editor (una vez)

-- Columna role: 'client' por defecto, 'admin' para administradores
alter table public.profiles
  add column if not exists role text not null default 'client'
  check (role in ('client', 'admin'));

comment on column public.profiles.role is 'client: paciente; admin: administrador del panel';

-- Para dar rol admin a un usuario (ejecutar en SQL Editor sustituyendo el email):
-- update public.profiles set role = 'admin' where id = (select id from auth.users where email = 'tu-admin@ejemplo.com');
