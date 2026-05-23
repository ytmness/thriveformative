-- CMS: servicios, planes, artículos y textos editables sin desplegar código

create table if not exists public.cms_services (
  id uuid primary key default gen_random_uuid(),
  locale text not null check (locale in ('es', 'en', 'ko', 'it')),
  sort_order int not null default 0,
  name text not null,
  description text not null default '',
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_cms_services_locale_sort
  on public.cms_services (locale, sort_order);

create table if not exists public.cms_plans (
  id uuid primary key default gen_random_uuid(),
  locale text not null check (locale in ('es', 'en', 'ko', 'it')),
  sort_order int not null default 0,
  name text not null,
  items jsonb not null default '[]'::jsonb,
  is_featured boolean not null default false,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_cms_plans_locale_sort
  on public.cms_plans (locale, sort_order);

create table if not exists public.cms_articles (
  id uuid primary key default gen_random_uuid(),
  locale text not null check (locale in ('es', 'en', 'ko', 'it')),
  sort_order int not null default 0,
  category text not null default '',
  title text not null,
  body text,
  image_url text,
  is_published boolean not null default true,
  published_at date default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_cms_articles_locale_sort
  on public.cms_articles (locale, sort_order);

create table if not exists public.cms_text_entries (
  id uuid primary key default gen_random_uuid(),
  locale text not null check (locale in ('es', 'en', 'ko', 'it')),
  content_key text not null,
  value text not null default '',
  updated_at timestamptz not null default now(),
  unique (locale, content_key)
);

create index if not exists idx_cms_text_entries_locale
  on public.cms_text_entries (locale);

alter table public.cms_services enable row level security;
alter table public.cms_plans enable row level security;
alter table public.cms_articles enable row level security;
alter table public.cms_text_entries enable row level security;

-- Lectura pública de contenido publicado (sitio sin login)
create policy "Public read published cms_services"
  on public.cms_services for select
  using (is_published = true);

create policy "Public read published cms_plans"
  on public.cms_plans for select
  using (is_published = true);

create policy "Public read published cms_articles"
  on public.cms_articles for select
  using (is_published = true);

create policy "Public read cms_text_entries"
  on public.cms_text_entries for select
  using (true);

-- Admin: gestión completa
create policy "Admin manage cms_services"
  on public.cms_services for all
  using (public.get_my_profile_role() = 'admin')
  with check (public.get_my_profile_role() = 'admin');

create policy "Admin manage cms_plans"
  on public.cms_plans for all
  using (public.get_my_profile_role() = 'admin')
  with check (public.get_my_profile_role() = 'admin');

create policy "Admin manage cms_articles"
  on public.cms_articles for all
  using (public.get_my_profile_role() = 'admin')
  with check (public.get_my_profile_role() = 'admin');

create policy "Admin manage cms_text_entries"
  on public.cms_text_entries for all
  using (public.get_my_profile_role() = 'admin')
  with check (public.get_my_profile_role() = 'admin');
