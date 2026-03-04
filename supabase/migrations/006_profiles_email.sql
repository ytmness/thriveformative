-- Thrive Formative: email en profiles para mostrar en panel admin
-- Sincronizado desde auth.users para identificar clientes aunque no tengan full_name

alter table public.profiles
  add column if not exists email text;

-- Actualizar trigger de nuevo usuario para guardar también el email
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, email)
  values (new.id, new.raw_user_meta_data->>'full_name', new.email);
  return new;
end;
$$ language plpgsql security definer;

-- Sincronizar email cuando se actualiza en auth.users (p. ej. cambio de email)
create or replace function public.sync_profile_email()
returns trigger as $$
begin
  update public.profiles set email = new.email, updated_at = now() where id = new.id;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_updated_sync_email on auth.users;
create trigger on_auth_user_updated_sync_email
  after update of email on auth.users
  for each row execute function public.sync_profile_email();

-- Rellenar email en perfiles existentes desde auth.users
update public.profiles p
set email = u.email
from auth.users u
where p.id = u.id and (p.email is null or p.email <> u.email);
