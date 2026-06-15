-- Tienda: categorías de productos

create table if not exists public.store_categories (
  id uuid primary key default gen_random_uuid(),
  locale text not null check (locale in ('es', 'en', 'ko', 'it')),
  name text not null,
  slug text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (locale, slug)
);

create index if not exists idx_store_categories_locale_sort
  on public.store_categories (locale, sort_order);

alter table public.store_products
  add column if not exists category_id uuid references public.store_categories (id) on delete set null;

create index if not exists idx_store_products_category_id
  on public.store_products (category_id);

alter table public.store_categories enable row level security;

create policy "Public read store_categories"
  on public.store_categories for select
  using (true);

create policy "Admin manage store_categories"
  on public.store_categories for all
  using (public.get_my_profile_role() = 'admin')
  with check (public.get_my_profile_role() = 'admin');
