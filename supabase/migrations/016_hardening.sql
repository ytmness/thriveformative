-- 016_hardening.sql — endurecimiento aditivo (sin borrar datos)

-- ─── updated_at automático ───
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare
  t text;
begin
  foreach t in array array[
    'profiles',
    'appointments',
    'booking_settings',
    'booking_weekly_hours',
    'cms_services',
    'cms_plans',
    'cms_articles',
    'cms_text_entries',
    'store_products',
    'store_categories'
  ]
  loop
    execute format('drop trigger if exists set_updated_at on public.%I', t);
    execute format(
      'create trigger set_updated_at before update on public.%I for each row execute function public.set_updated_at()',
      t
    );
  end loop;
end $$;

-- ─── Slots ocupados sin exponer PII de citas ───
create or replace function public.get_taken_slots(p_date date)
returns table (time_slot text)
language sql
security definer
set search_path = public
stable
as $$
  select a.time_slot
  from public.appointments a
  where a.appointment_date = p_date
    and a.status <> 'cancelled';
$$;

revoke all on function public.get_taken_slots(date) from public;
grant execute on function public.get_taken_slots(date) to anon, authenticated;

-- Reemplazar lectura abierta de citas por lectura propia + admin
drop policy if exists "Authenticated can read availability" on public.appointments;

create policy "Users can view own appointments"
  on public.appointments for select
  using (auth.uid() = user_id);

-- Admins ya tienen "Admins can view all appointments"

-- ─── Notificaciones: quitar insert anónimo abierto ───
drop policy if exists "Allow insert contact_request notifications" on public.notifications;

-- ─── Constraints de datos críticos ───
alter table public.store_products
  drop constraint if exists store_products_price_min_nonneg,
  drop constraint if exists store_products_price_max_nonneg,
  drop constraint if exists store_products_price_range,
  drop constraint if exists store_products_currency_format;

alter table public.store_products
  add constraint store_products_price_min_nonneg
    check (price_min is null or price_min >= 0) not valid,
  add constraint store_products_price_max_nonneg
    check (price_max is null or price_max >= 0) not valid,
  add constraint store_products_price_range
    check (
      price_min is null
      or price_max is null
      or price_min <= price_max
    ) not valid,
  add constraint store_products_currency_format
    check (currency is null or currency ~ '^[A-Z]{3}$') not valid;

alter table public.notifications
  drop constraint if exists notifications_type_check;

alter table public.notifications
  add constraint notifications_type_check
    check (
      type in (
        'contact_request',
        'appointment_pending',
        'appointment_confirmed',
        'appointment_cancelled'
      )
    ) not valid;

alter table public.contact_requests
  drop constraint if exists contact_requests_email_format;

alter table public.contact_requests
  add constraint contact_requests_email_format
    check (email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$') not valid;

-- Validar constraints (fallará solo si hay datos inválidos previos)
alter table public.store_products validate constraint store_products_price_min_nonneg;
alter table public.store_products validate constraint store_products_price_max_nonneg;
alter table public.store_products validate constraint store_products_price_range;
alter table public.store_products validate constraint store_products_currency_format;
alter table public.notifications validate constraint notifications_type_check;
alter table public.contact_requests validate constraint contact_requests_email_format;

-- ─── Índices ───
create index if not exists idx_appointments_date_status
  on public.appointments (appointment_date, status);

create index if not exists idx_profiles_created_at
  on public.profiles (created_at desc);

create index if not exists idx_store_products_locale_published_sort
  on public.store_products (locale, sort_order)
  where is_published = true;

create index if not exists idx_cms_services_locale_published_sort
  on public.cms_services (locale, sort_order)
  where is_published = true;

create index if not exists idx_cms_plans_locale_published_sort
  on public.cms_plans (locale, sort_order)
  where is_published = true;

create index if not exists idx_cms_articles_locale_published_sort
  on public.cms_articles (locale, sort_order)
  where is_published = true;
