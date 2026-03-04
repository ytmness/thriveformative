-- Thrive Formative: solicitudes de contacto y notificaciones

-- Solicitudes del formulario de contacto
create table if not exists public.contact_requests (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  subject text,
  message text not null,
  read_at timestamptz,
  created_at timestamptz default now()
);

alter table public.contact_requests enable row level security;

create policy "Anyone can insert contact_requests"
  on public.contact_requests for insert with check (true);

create policy "Admins can view contact_requests"
  on public.contact_requests for select
  using (public.get_my_profile_role() = 'admin');

create policy "Admins can update contact_requests"
  on public.contact_requests for update
  using (public.get_my_profile_role() = 'admin');

-- Notificaciones: user_id null = para admins; con valor = para ese cliente
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  type text not null,
  title text not null,
  body text,
  reference_id uuid,
  read_at timestamptz,
  created_at timestamptz default now()
);

alter table public.notifications enable row level security;

create index if not exists idx_notifications_user_id on public.notifications(user_id);
create index if not exists idx_notifications_read_at on public.notifications(read_at);
create index if not exists idx_notifications_created_at on public.notifications(created_at desc);
create index if not exists idx_contact_requests_created_at on public.contact_requests(created_at desc);

-- Admins ven y actualizan notificaciones donde user_id es null
create policy "Admins can view admin notifications"
  on public.notifications for select
  using (user_id is null and public.get_my_profile_role() = 'admin');

create policy "Admins can update admin notifications"
  on public.notifications for update
  using (user_id is null and public.get_my_profile_role() = 'admin');

-- Usuarios ven y actualizan solo sus notificaciones
create policy "Users can view own notifications"
  on public.notifications for select using (user_id = auth.uid());

create policy "Users can update own notifications"
  on public.notifications for update using (user_id = auth.uid());

-- Permitir insert para que el trigger (que corre en sesión anon al enviar el formulario) pueda crear la notificación
create policy "Allow insert contact_request notifications"
  on public.notifications for insert
  with check (type = 'contact_request' and reference_id is not null);

-- Trigger: al insertar contact_requests, crear notificación para admins
create or replace function public.notify_admins_contact_request()
returns trigger as $$
begin
  insert into public.notifications (user_id, type, title, body, reference_id)
  values (null, 'contact_request', 'Nueva solicitud: ' || coalesce(new.subject, '(sin asunto)'), new.name || ' — ' || new.email, new.id);
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_contact_request_created on public.contact_requests;
create trigger on_contact_request_created
  after insert on public.contact_requests
  for each row execute function public.notify_admins_contact_request();
