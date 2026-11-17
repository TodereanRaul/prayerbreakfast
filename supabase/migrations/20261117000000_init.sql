-- Prayer Breakfasts directory: events, nations "in progress", admins, image storage.

-- ---------------------------------------------------------------------------
-- Admins: only users listed here can change content.
-- Add one with:
--   insert into public.admins (user_id)
--   select id from auth.users where email = 'someone@example.org';
-- ---------------------------------------------------------------------------
create table public.admins (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admins enable row level security;

create policy "Admins can see their own row"
  on public.admins for select to authenticated
  using (user_id = (select auth.uid()));

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.admins where user_id = (select auth.uid())
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Shared trigger to keep updated_at current
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Events
-- ---------------------------------------------------------------------------
create type public.event_status as enum ('confirmed', 'tbc', 'cancelled');

create table public.events (
  id               uuid primary key default gen_random_uuid(),
  title            text not null check (length(trim(title)) > 0),
  short_name       text,
  city             text,
  country          text not null,
  country_code     text check (country_code is null or country_code ~ '^[A-Z]{2}$'),
  venue            text,

  -- Dates: year (and usually month) are always known; exact days may not be.
  year             int  not null check (year between 1950 and 2200),
  month            int  check (month between 1 and 12),
  start_date       date,
  end_date         date,
  date_note        text,            -- e.g. "Week 21", "Date to be confirmed"
  status           public.event_status not null default 'confirmed',

  description      text,
  website_url      text,            -- "More info" button
  contact_name     text,            -- "Contact" button (one per event)
  contact_email    text,
  contact_phone    text,
  contact_url      text,

  -- City photo, found automatically from the city name (or uploaded by an admin)
  image_query      text,            -- optional override for the photo search
  image_url        text,
  image_path       text,            -- path inside the event-images bucket
  image_credit     text,
  image_source_url text,

  published        boolean not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),

  constraint events_end_after_start
    check (end_date is null or start_date is null or end_date >= start_date)
);

create index events_year_month_idx on public.events (year, month, start_date);

create trigger events_set_updated_at
  before update on public.events
  for each row execute function public.set_updated_at();

alter table public.events enable row level security;

create policy "Published events are public"
  on public.events for select to anon, authenticated
  using (published or (select public.is_admin()));

create policy "Admins insert events"
  on public.events for insert to authenticated
  with check ((select public.is_admin()));

create policy "Admins update events"
  on public.events for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "Admins delete events"
  on public.events for delete to authenticated
  using ((select public.is_admin()));

-- ---------------------------------------------------------------------------
-- Nations where a prayer breakfast is being started or info is still missing
-- ---------------------------------------------------------------------------
create table public.nations (
  id           uuid primary key default gen_random_uuid(),
  country      text not null,
  country_code text check (country_code is null or country_code ~ '^[A-Z]{2}$'),
  status       text not null default 'info_needed'
               check (status in ('in_progress', 'info_needed')),
  note         text,
  sort_order   int  not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create trigger nations_set_updated_at
  before update on public.nations
  for each row execute function public.set_updated_at();

alter table public.nations enable row level security;

create policy "Nations are public"
  on public.nations for select to anon, authenticated
  using (true);

create policy "Admins insert nations"
  on public.nations for insert to authenticated
  with check ((select public.is_admin()));

create policy "Admins update nations"
  on public.nations for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "Admins delete nations"
  on public.nations for delete to authenticated
  using ((select public.is_admin()));

-- ---------------------------------------------------------------------------
-- Storage bucket for event photos (public read, admin write)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'event-images', 'event-images', true, 8388608,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do nothing;

create policy "Admins upload event images"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'event-images' and (select public.is_admin()));

create policy "Admins update event images"
  on storage.objects for update to authenticated
  using (bucket_id = 'event-images' and (select public.is_admin()));

create policy "Admins delete event images"
  on storage.objects for delete to authenticated
  using (bucket_id = 'event-images' and (select public.is_admin()));
