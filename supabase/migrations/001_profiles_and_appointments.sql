-- Thrive Formative: tablas para perfiles y citas
-- Ejecutar en Supabase SQL Editor: https://supabase.com/dashboard/project/TU_PROJECT_REF/sql

-- Perfil extendido del usuario (opcional; auth.users ya existe)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Citas / turnos
create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  appointment_date date not null,
  time_slot text not null,
  type text not null default 'inicial' check (type in ('inicial', 'seguimiento')),
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'cancelled')),
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(appointment_date, time_slot)
);

-- RLS
alter table public.profiles enable row level security;
alter table public.appointments enable row level security;

-- Perfiles: el usuario solo ve/edita el suyo
create policy "Users can view own profile"
  on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);
create policy "Users can insert own profile"
  on public.profiles for insert with check (auth.uid() = id);

-- Citas: cualquier autenticado puede leer (solo para ver disponibilidad por fecha/slot)
create policy "Authenticated can read availability"
  on public.appointments for select to authenticated using (true);
create policy "Users can insert own appointments"
  on public.appointments for insert with check (auth.uid() = user_id);
create policy "Users can update own appointments"
  on public.appointments for update using (auth.uid() = user_id);

-- Trigger para crear perfil al registrarse
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Índices
create index if not exists idx_appointments_user_id on public.appointments(user_id);
create index if not exists idx_appointments_date on public.appointments(appointment_date);
