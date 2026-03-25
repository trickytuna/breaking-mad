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

create table if not exists public.site_metrics (
  key text primary key,
  value bigint not null default 0,
  updated_at timestamptz not null default timezone('utc', now())
);

insert into public.site_metrics (key, value)
values ('site_visits', 0)
on conflict (key) do nothing;

create table if not exists public.site_post_reactions (
  post_id uuid not null references public.site_posts(id) on delete cascade,
  visitor_id uuid not null,
  reaction text not null check (reaction in ('like', 'dislike')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (post_id, visitor_id)
);

create index if not exists site_post_reactions_post_reaction_idx
  on public.site_post_reactions (post_id, reaction);

create or replace function public.set_site_metrics_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists set_site_metrics_updated_at on public.site_metrics;
create trigger set_site_metrics_updated_at
before update on public.site_metrics
for each row
execute function public.set_site_metrics_updated_at();

create or replace function public.set_site_post_reactions_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists set_site_post_reactions_updated_at on public.site_post_reactions;
create trigger set_site_post_reactions_updated_at
before update on public.site_post_reactions
for each row
execute function public.set_site_post_reactions_updated_at();

alter table public.site_metrics enable row level security;
alter table public.site_post_reactions enable row level security;

create or replace function public.get_site_visits()
returns bigint
language sql
security definer
set search_path = public
as $$
  select coalesce(
    (select value from public.site_metrics where key = 'site_visits'),
    0
  );
$$;

create or replace function public.increment_site_visits()
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  next_value bigint;
begin
  insert into public.site_metrics (key, value)
  values ('site_visits', 1)
  on conflict (key)
  do update
    set value = public.site_metrics.value + 1,
        updated_at = timezone('utc', now())
  returning value into next_value;

  return coalesce(next_value, 0);
end;
$$;

create or replace function public.get_work_reaction_summary(
  target_post_id uuid,
  target_visitor_id uuid default null
)
returns table (
  like_count bigint,
  dislike_count bigint,
  current_reaction text
)
language sql
security definer
set search_path = public
as $$
  select
    count(*) filter (where reaction = 'like')::bigint as like_count,
    count(*) filter (where reaction = 'dislike')::bigint as dislike_count,
    max(
      case
        when visitor_id = target_visitor_id then reaction
        else null
      end
    )::text as current_reaction
  from public.site_post_reactions
  where post_id = target_post_id;
$$;

create or replace function public.set_work_reaction(
  target_post_id uuid,
  target_visitor_id uuid,
  target_reaction text
)
returns table (
  like_count bigint,
  dislike_count bigint,
  current_reaction text
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if target_reaction not in ('like', 'dislike') then
    raise exception 'Reaction must be like or dislike';
  end if;

  if not exists (
    select 1
    from public.site_posts
    where id = target_post_id
      and section = 'work'
      and status = 'published'
  ) then
    raise exception 'Published work post not found';
  end if;

  insert into public.site_post_reactions (post_id, visitor_id, reaction)
  values (target_post_id, target_visitor_id, target_reaction)
  on conflict (post_id, visitor_id)
  do update
    set reaction = excluded.reaction,
        updated_at = timezone('utc', now());

  return query
  select *
  from public.get_work_reaction_summary(target_post_id, target_visitor_id);
end;
$$;

revoke all on function public.get_site_visits() from public;
revoke all on function public.increment_site_visits() from public;
revoke all on function public.get_work_reaction_summary(uuid, uuid) from public;
revoke all on function public.set_work_reaction(uuid, uuid, text) from public;

grant execute on function public.get_site_visits() to anon, authenticated;
grant execute on function public.increment_site_visits() to anon, authenticated;
grant execute on function public.get_work_reaction_summary(uuid, uuid) to anon, authenticated;
grant execute on function public.set_work_reaction(uuid, uuid, text) to anon, authenticated;
