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

drop policy if exists "Authenticated users can read reactions" on public.site_post_reactions;
create policy "Authenticated users can read reactions"
on public.site_post_reactions
for select
to authenticated
using (true);

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
grant select on public.site_post_reactions to authenticated;

create table if not exists public.site_analytics_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null check (event_type in ('page_view', 'launch_document_click')),
  pathname text not null default '/',
  content_section text check (content_section in ('journal', 'work')),
  content_slug text not null default '',
  target_label text not null default '',
  target_url text not null default '',
  referrer_host text not null default '',
  utm_source text not null default '',
  utm_medium text not null default '',
  utm_campaign text not null default '',
  country text not null default '',
  region text not null default '',
  city text not null default '',
  timezone text not null default '',
  browser_name text not null default '',
  os_name text not null default '',
  device_type text not null default '',
  visitor_id uuid not null,
  session_id uuid not null,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists site_analytics_events_created_at_idx
  on public.site_analytics_events (created_at desc);

create index if not exists site_analytics_events_event_type_idx
  on public.site_analytics_events (event_type, created_at desc);

create index if not exists site_analytics_events_pathname_idx
  on public.site_analytics_events (pathname);

create index if not exists site_analytics_events_content_idx
  on public.site_analytics_events (content_section, content_slug);

alter table public.site_analytics_events enable row level security;

drop policy if exists "Authenticated users can read analytics events" on public.site_analytics_events;
create policy "Authenticated users can read analytics events"
on public.site_analytics_events
for select
to authenticated
using (true);

drop policy if exists "Visitors can create analytics events" on public.site_analytics_events;
create policy "Visitors can create analytics events"
on public.site_analytics_events
for insert
to anon, authenticated
with check (event_type in ('page_view', 'launch_document_click'));

grant insert on public.site_analytics_events to anon, authenticated;
grant select on public.site_analytics_events to authenticated;

create table if not exists public.photo_assets (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  alt_text text not null default '',
  description text not null default '',
  file_path text not null unique,
  status text not null default 'draft' check (status in ('draft', 'published')),
  featured boolean not null default false,
  featured_order integer,
  published_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.photo_assets
  add column if not exists featured boolean not null default false;

alter table public.photo_assets
  add column if not exists featured_order integer;

create index if not exists photo_assets_status_published_idx
  on public.photo_assets (status, published_at desc);

create index if not exists photo_assets_featured_idx
  on public.photo_assets (featured desc, featured_order asc, published_at desc);

create or replace function public.set_photo_assets_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists set_photo_assets_updated_at on public.photo_assets;
create trigger set_photo_assets_updated_at
before update on public.photo_assets
for each row
execute function public.set_photo_assets_updated_at();

alter table public.photo_assets enable row level security;

drop policy if exists "Public can read published photos" on public.photo_assets;
create policy "Public can read published photos"
on public.photo_assets
for select
to anon, authenticated
using (status = 'published' or auth.role() = 'authenticated');

drop policy if exists "Authenticated users can manage photos" on public.photo_assets;
create policy "Authenticated users can manage photos"
on public.photo_assets
for all
to authenticated
using (true)
with check (true);

grant select on public.photo_assets to anon;
grant all on public.photo_assets to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'site-photos',
  'site-photos',
  true,
  20971520,
  array['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']::text[]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public can view site photos bucket" on storage.objects;
create policy "Public can view site photos bucket"
on storage.objects
for select
to public
using (bucket_id = 'site-photos');

drop policy if exists "Authenticated users can upload site photos" on storage.objects;
create policy "Authenticated users can upload site photos"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'site-photos');

drop policy if exists "Authenticated users can update site photos" on storage.objects;
create policy "Authenticated users can update site photos"
on storage.objects
for update
to authenticated
using (bucket_id = 'site-photos')
with check (bucket_id = 'site-photos');

drop policy if exists "Authenticated users can delete site photos" on storage.objects;
create policy "Authenticated users can delete site photos"
on storage.objects
for delete
to authenticated
using (bucket_id = 'site-photos');

create table if not exists public.site_subscribers (
  id uuid primary key default gen_random_uuid(),
  channel text not null check (channel in ('email', 'sms')),
  contact_value text not null,
  email text not null default '',
  phone text not null default '',
  status text not null default 'active' check (status in ('active', 'unsubscribed')),
  unsubscribe_token uuid not null default gen_random_uuid(),
  confirmed_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists site_subscribers_channel_contact_idx
  on public.site_subscribers (channel, contact_value);

create index if not exists site_subscribers_status_idx
  on public.site_subscribers (status, channel, created_at desc);

create table if not exists public.site_notification_deliveries (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.site_posts(id) on delete cascade,
  subscriber_id uuid not null references public.site_subscribers(id) on delete cascade,
  channel text not null check (channel in ('email', 'sms')),
  status text not null default 'sent' check (status in ('sent', 'failed')),
  provider_message_id text not null default '',
  error_message text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  unique (post_id, subscriber_id)
);

create index if not exists site_notification_deliveries_post_idx
  on public.site_notification_deliveries (post_id, created_at desc);

create or replace function public.set_site_subscribers_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists set_site_subscribers_updated_at on public.site_subscribers;
create trigger set_site_subscribers_updated_at
before update on public.site_subscribers
for each row
execute function public.set_site_subscribers_updated_at();

alter table public.site_subscribers enable row level security;
alter table public.site_notification_deliveries enable row level security;

drop policy if exists "Authenticated users can read site subscribers" on public.site_subscribers;
create policy "Authenticated users can read site subscribers"
on public.site_subscribers
for select
to authenticated
using (true);

drop policy if exists "Authenticated users can read notification deliveries" on public.site_notification_deliveries;
create policy "Authenticated users can read notification deliveries"
on public.site_notification_deliveries
for select
to authenticated
using (true);

drop policy if exists "Authenticated users can insert notification deliveries" on public.site_notification_deliveries;
create policy "Authenticated users can insert notification deliveries"
on public.site_notification_deliveries
for insert
to authenticated
with check (true);

grant select on public.site_subscribers to authenticated;
grant select, insert on public.site_notification_deliveries to authenticated;

create or replace function public.register_site_subscriber(
  target_channel text,
  target_contact_value text,
  target_email text default '',
  target_phone text default ''
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  saved_id uuid;
begin
  if target_channel not in ('email', 'sms') then
    raise exception 'Unsupported notification channel';
  end if;

  if btrim(target_contact_value) = '' then
    raise exception 'Missing contact value';
  end if;

  insert into public.site_subscribers (
    channel,
    contact_value,
    email,
    phone,
    status,
    confirmed_at
  )
  values (
    target_channel,
    lower(btrim(target_contact_value)),
    lower(btrim(target_email)),
    btrim(target_phone),
    'active',
    timezone('utc', now())
  )
  on conflict (channel, contact_value)
  do update
    set email = case
      when excluded.email <> '' then excluded.email
      else public.site_subscribers.email
    end,
        phone = case
      when excluded.phone <> '' then excluded.phone
      else public.site_subscribers.phone
    end,
        status = 'active',
        confirmed_at = timezone('utc', now()),
        updated_at = timezone('utc', now())
  returning id into saved_id;

  return saved_id;
end;
$$;

create or replace function public.unsubscribe_site_subscriber(target_token uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  did_update boolean;
begin
  update public.site_subscribers
  set status = 'unsubscribed',
      updated_at = timezone('utc', now())
  where unsubscribe_token = target_token
  returning true into did_update;

  return coalesce(did_update, false);
end;
$$;

revoke all on function public.register_site_subscriber(text, text, text, text) from public;
revoke all on function public.unsubscribe_site_subscriber(uuid) from public;

grant execute on function public.register_site_subscriber(text, text, text, text) to anon, authenticated;
grant execute on function public.unsubscribe_site_subscriber(uuid) to anon, authenticated;
