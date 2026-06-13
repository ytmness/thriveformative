-- Tienda: catálogo de productos con enlace de referido externo

create table if not exists public.store_products (
  id uuid primary key default gen_random_uuid(),
  locale text not null check (locale in ('es', 'en', 'ko', 'it')),
  sort_order int not null default 0,
  name text not null,
  description text not null default '',
  ref text not null,
  referral_url text not null,
  image_url text,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (locale, ref)
);

create index if not exists idx_store_products_locale_sort
  on public.store_products (locale, sort_order);

create index if not exists idx_store_products_locale_ref
  on public.store_products (locale, ref);

alter table public.store_products enable row level security;

create policy "Public read published store_products"
  on public.store_products for select
  using (is_published = true);

create policy "Admin manage store_products"
  on public.store_products for all
  using (public.get_my_profile_role() = 'admin')
  with check (public.get_my_profile_role() = 'admin');
