-- Thrive Formative: permitir a admins crear notificaciones para clientes (p. ej. cita confirmada/cancelada)

create policy "Admins can insert notifications for users"
  on public.notifications for insert
  with check (
    public.get_my_profile_role() = 'admin'
    and user_id is not null
  );
