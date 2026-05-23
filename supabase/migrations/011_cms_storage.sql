-- Almacenamiento de imágenes del CMS (artículos, etc.)

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'cms-images',
  'cms-images',
  true,
  5242880,
  array['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Lectura pública (sitio sin login)
create policy "Public read cms-images"
  on storage.objects for select
  using (bucket_id = 'cms-images');

-- Admin: subir y gestionar
create policy "Admin insert cms-images"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'cms-images'
    and public.get_my_profile_role() = 'admin'
  );

create policy "Admin update cms-images"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'cms-images'
    and public.get_my_profile_role() = 'admin'
  )
  with check (
    bucket_id = 'cms-images'
    and public.get_my_profile_role() = 'admin'
  );

create policy "Admin delete cms-images"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'cms-images'
    and public.get_my_profile_role() = 'admin'
  );
