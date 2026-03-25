create extension if not exists pgcrypto;

create table if not exists public.site_posts (
  id uuid primary key default gen_random_uuid(),
  section text not null check (section in ('journal', 'work')),
  status text not null default 'draft' check (status in ('draft', 'published')),
  title text not null,
  slug text not null unique,
  excerpt text not null default '',
  body text not null default '',
  documents jsonb not null default '[]'::jsonb,
  published_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.site_posts
  add column if not exists documents jsonb not null default '[]'::jsonb;

create index if not exists site_posts_section_status_published_idx
  on public.site_posts (section, status, published_at desc);

create or replace function public.set_site_posts_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists set_site_posts_updated_at on public.site_posts;
create trigger set_site_posts_updated_at
before update on public.site_posts
for each row
execute function public.set_site_posts_updated_at();

alter table public.site_posts enable row level security;

drop policy if exists "Public can read published site posts" on public.site_posts;
create policy "Public can read published site posts"
on public.site_posts
for select
to anon, authenticated
using (status = 'published' or auth.role() = 'authenticated');

drop policy if exists "Authenticated users can manage site posts" on public.site_posts;
create policy "Authenticated users can manage site posts"
on public.site_posts
for all
to authenticated
using (true)
with check (true);

grant select on public.site_posts to anon;
grant all on public.site_posts to authenticated;
