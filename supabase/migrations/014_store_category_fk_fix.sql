-- Asegura FK store_products → store_categories y recarga caché de PostgREST

alter table public.store_products
  add column if not exists category_id uuid;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'store_products_category_id_fkey'
  ) then
    alter table public.store_products
      add constraint store_products_category_id_fkey
      foreign key (category_id)
      references public.store_categories (id)
      on delete set null;
  end if;
end $$;

create index if not exists idx_store_products_category_id
  on public.store_products (category_id);

notify pgrst, 'reload schema';
