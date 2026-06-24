-- Tienda: precios y metadatos de origen para productos importados

alter table public.store_products
  add column if not exists price_min numeric(10, 2);

alter table public.store_products
  add column if not exists price_max numeric(10, 2);

alter table public.store_products
  add column if not exists compare_at_price_min numeric(10, 2);

alter table public.store_products
  add column if not exists currency text default 'USD';

alter table public.store_products
  add column if not exists source text;

alter table public.store_products
  add column if not exists source_handle text;

alter table public.store_products
  add column if not exists source_payload jsonb;

create index if not exists idx_store_products_source
  on public.store_products (source);

create index if not exists idx_store_products_source_handle
  on public.store_products (source, source_handle);

notify pgrst, 'reload schema';
