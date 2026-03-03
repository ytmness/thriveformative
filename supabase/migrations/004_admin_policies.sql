-- Thrive Formative: políticas RLS para administradores
-- Requiere columna public.profiles.role ('client' | 'admin')

-- Helper: condición "es admin"
-- (No se crea función para mantenerlo simple; se repite el exists)

-- Perfiles: admin puede ver todos los perfiles
drop policy if exists "Admins can view all profiles" on public.profiles;
create policy "Admins can view all profiles"
  on public.profiles
  for select
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role = 'admin'
    )
  );

-- Citas: admin puede ver todas las citas
drop policy if exists "Admins can view all appointments" on public.appointments;
create policy "Admins can view all appointments"
  on public.appointments
  for select
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role = 'admin'
    )
  );

-- Citas: admin puede actualizar cualquier cita (confirmar/cancelar/etc.)
drop policy if exists "Admins can update all appointments" on public.appointments;
create policy "Admins can update all appointments"
  on public.appointments
  for update
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role = 'admin'
    )
  );

