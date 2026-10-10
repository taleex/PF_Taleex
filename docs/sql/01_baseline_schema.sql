-- 01 Baseline schema (DB-001 / DB-005)
-- Recreates tables that were created in the dashboard and never recorded in
-- supabase/migrations. Fully idempotent: a no-op on the current live project.
-- To use as a real migration, copy to supabase/migrations/20251001000000_baseline_schema.sql
-- (timestamped BEFORE the existing migrations, because they ALTER these tables).

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end; $$;

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  display_name text not null,
  title text not null,
  bio text, avatar_url text, cv_url text, email text, location text, interests text,
  experience_years integer,
  tags text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  image_url text, tags text[], github_url text, demo_url text,
  featured boolean default false,
  order_index integer default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.experiences (
  id uuid primary key default gen_random_uuid(),
  position text not null,
  company text not null,
  period text not null,
  description text, employment_type text, location text, highlights text[],
  order_index integer default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.skill_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  icon text,
  order_index integer default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.skills (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category_id uuid references public.skill_categories(id) on delete cascade,
  icon text, level integer, svg_url text,
  order_index integer default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.contact_info (
  id uuid primary key default gen_random_uuid(),
  info_key text not null unique,
  label text not null,
  value text not null,
  icon text, icon_name text, link text, type text,
  order_index integer default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.page_sections (
  id uuid primary key default gen_random_uuid(),
  section_key text not null unique,
  title text, subtitle text, content text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.site_content (
  id uuid primary key default gen_random_uuid(),
  section text not null,
  key text not null,
  value text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (section, key)
);

create table if not exists public.site_images (
  id uuid primary key default gen_random_uuid(),
  image_key text not null unique,
  image_url text not null,
  alt_text text, description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Grants (RLS still decides who can write)
grant select on public.profiles, public.projects, public.experiences, public.skill_categories,
  public.skills, public.contact_info, public.page_sections, public.site_content, public.site_images
  to anon, authenticated;
grant insert, update, delete on public.profiles, public.projects, public.experiences,
  public.skill_categories, public.skills, public.contact_info, public.page_sections,
  public.site_content, public.site_images to authenticated;
grant all on public.profiles, public.projects, public.experiences, public.skill_categories,
  public.skills, public.contact_info, public.page_sections, public.site_content, public.site_images
  to service_role;

-- RLS + public read policy if none exists (admin write policies come from 20251003183633)
do $$ declare t text; begin
  foreach t in array array['profiles','projects','experiences','skill_categories','skills',
    'contact_info','page_sections','site_content','site_images'] loop
    execute format('alter table public.%I enable row level security', t);
    if not exists (select 1 from pg_policies where schemaname='public' and tablename=t and cmd='SELECT') then
      execute format('create policy "Public read %1$s" on public.%1$I for select using (true)', t);
    end if;
  end loop;
end $$;

-- updated_at triggers
do $$ declare t text; begin
  foreach t in array array['profiles','projects','experiences','page_sections','site_content','site_images'] loop
    if not exists (select 1 from pg_trigger where tgname='set_updated_at'
                   and tgrelid = format('public.%I', t)::regclass) then
      execute format('create trigger set_updated_at before update on public.%I
                      for each row execute function public.set_updated_at()', t);
    end if;
  end loop;
end $$;
