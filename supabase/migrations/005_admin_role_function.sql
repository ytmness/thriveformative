-- Thrive Formative: evitar recursión en RLS al leer role desde profiles
-- Las políticas "Admins can view..." hacían SELECT en profiles para comprobar role,
-- lo que disparaba RLS de nuevo y causaba 500. Usamos una función SECURITY DEFINER.

create or replace function public.get_my_profile_role()
returns text
language sql
security definer
set search_path = public
stable
as $$
  select role from public.profiles where id = auth.uid() limit 1;
$$;

-- Recrear políticas de admin usando la función (sin subquery a profiles)
drop policy if exists "Admins can view all profiles" on public.profiles;
create policy "Admins can view all profiles"
  on public.profiles
  for select
  using (get_my_profile_role() = 'admin');

drop policy if exists "Admins can view all appointments" on public.appointments;
create policy "Admins can view all appointments"
  on public.appointments
  for select
  using (get_my_profile_role() = 'admin');

drop policy if exists "Admins can update all appointments" on public.appointments;
create policy "Admins can update all appointments"
  on public.appointments
  for update
  using (get_my_profile_role() = 'admin');
