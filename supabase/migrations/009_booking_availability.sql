-- Configuración de disponibilidad para citas (horarios, días bloqueados, vacaciones)

-- Ajustes globales (una sola fila)
create table if not exists public.booking_settings (
  id smallint primary key default 1 check (id = 1),
  slot_duration_minutes int not null default 30
    check (slot_duration_minutes in (15, 20, 30, 45, 60)),
  min_advance_days int not null default 1 check (min_advance_days >= 0),
  max_advance_days int not null default 90 check (max_advance_days >= 1),
  updated_at timestamptz not null default now()
);

insert into public.booking_settings (id)
values (1)
on conflict (id) do nothing;

-- Horario por día de la semana (0 = domingo … 6 = sábado, igual que JS Date.getDay())
create table if not exists public.booking_weekly_hours (
  day_of_week smallint primary key check (day_of_week between 0 and 6),
  is_enabled boolean not null default false,
  start_time time not null default '09:00',
  end_time time not null default '18:00',
  updated_at timestamptz not null default now(),
  constraint booking_weekly_hours_range check (end_time > start_time)
);

insert into public.booking_weekly_hours (day_of_week, is_enabled, start_time, end_time)
values
  (0, false, '09:00', '14:00'),
  (1, true, '09:00', '18:00'),
  (2, true, '09:00', '18:00'),
  (3, true, '09:00', '18:00'),
  (4, true, '09:00', '18:00'),
  (5, true, '09:00', '18:00'),
  (6, false, '09:00', '14:00')
on conflict (day_of_week) do nothing;

-- Días bloqueados (vacaciones, feriados, cierre puntual)
create table if not exists public.booking_blocked_dates (
  id uuid primary key default gen_random_uuid(),
  blocked_date date not null unique,
  reason text,
  created_at timestamptz not null default now()
);

create index if not exists idx_booking_blocked_dates_date
  on public.booking_blocked_dates (blocked_date);

alter table public.booking_settings enable row level security;
alter table public.booking_weekly_hours enable row level security;
alter table public.booking_blocked_dates enable row level security;

-- Lectura para usuarios autenticados (calendario público de citas)
create policy "Authenticated read booking_settings"
  on public.booking_settings for select to authenticated using (true);

create policy "Authenticated read booking_weekly_hours"
  on public.booking_weekly_hours for select to authenticated using (true);

create policy "Authenticated read booking_blocked_dates"
  on public.booking_blocked_dates for select to authenticated using (true);

-- Gestión solo admin
create policy "Admin manage booking_settings"
  on public.booking_settings for all
  using (public.get_my_profile_role() = 'admin')
  with check (public.get_my_profile_role() = 'admin');

create policy "Admin manage booking_weekly_hours"
  on public.booking_weekly_hours for all
  using (public.get_my_profile_role() = 'admin')
  with check (public.get_my_profile_role() = 'admin');

create policy "Admin manage booking_blocked_dates"
  on public.booking_blocked_dates for all
  using (public.get_my_profile_role() = 'admin')
  with check (public.get_my_profile_role() = 'admin');

-- Validar cita al insertar (horario real + día habilitado + no bloqueado)
create or replace function public.validate_appointment_booking()
returns trigger
language plpgsql
as $$
declare
  v_settings public.booking_settings%rowtype;
  v_hours public.booking_weekly_hours%rowtype;
  v_dow int;
  v_slot time;
  v_start_min int;
  v_end_min int;
  v_slot_min int;
  v_dur int;
begin
  select * into v_settings from public.booking_settings where id = 1;
  if not found then
    raise exception 'Sistema de citas no configurado';
  end if;

  if NEW.appointment_date < (current_date + v_settings.min_advance_days) then
    raise exception 'No se pueden agendar citas para esa fecha (anticipación mínima)';
  end if;

  if NEW.appointment_date > (current_date + v_settings.max_advance_days) then
    raise exception 'La fecha está fuera del rango permitido para agendar';
  end if;

  if exists (
    select 1 from public.booking_blocked_dates b
    where b.blocked_date = NEW.appointment_date
  ) then
    raise exception 'Ese día no está disponible (bloqueado)';
  end if;

  v_dow := extract(dow from NEW.appointment_date)::int;

  select * into v_hours
  from public.booking_weekly_hours
  where day_of_week = v_dow;

  if not found or not v_hours.is_enabled then
    raise exception 'No hay atención ese día de la semana';
  end if;

  begin
    v_slot := NEW.time_slot::time;
  exception
    when others then
      raise exception 'Formato de horario inválido';
  end;

  if v_slot < v_hours.start_time or v_slot >= v_hours.end_time then
    raise exception 'Horario fuera del rango de atención';
  end if;

  v_dur := v_settings.slot_duration_minutes;
  v_start_min := extract(hour from v_hours.start_time)::int * 60
    + extract(minute from v_hours.start_time)::int;
  v_end_min := extract(hour from v_hours.end_time)::int * 60
    + extract(minute from v_hours.end_time)::int;
  v_slot_min := extract(hour from v_slot)::int * 60 + extract(minute from v_slot)::int;

  if (v_slot_min - v_start_min) % v_dur <> 0 then
    raise exception 'Horario no coincide con la duración de cita configurada';
  end if;

  if v_slot_min + v_dur > v_end_min then
    raise exception 'El horario no cabe en el bloque de atención';
  end if;

  return NEW;
end;
$$;

drop trigger if exists validate_appointment_booking_trigger on public.appointments;
create trigger validate_appointment_booking_trigger
  before insert on public.appointments
  for each row execute function public.validate_appointment_booking();
