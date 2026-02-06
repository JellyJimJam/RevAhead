-- RevAhead Mileage Phase 1 schema
-- Run in Supabase SQL Editor as a single script.

create extension if not exists pgcrypto;

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  role text not null default 'parent' check (role in ('parent', 'employee')),
  created_at timestamptz not null default now()
);

create table if not exists public.children (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.users(id) on delete cascade,
  nickname text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.places (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.users(id) on delete cascade,
  label text not null,
  address text,
  created_at timestamptz not null default now()
);

create table if not exists public.trips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.users(id) on delete cascade,
  date date not null,
  start_place_id uuid references public.places(id) on delete set null,
  end_place_id uuid references public.places(id) on delete set null,
  start_text text,
  end_text text,
  miles numeric(8,2) not null check (miles > 0),
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.users(id) on delete cascade,
  month int not null check (month between 1 and 12),
  year int not null check (year >= 2000),
  status text not null default 'draft',
  snapshot_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.users enable row level security;
alter table public.children enable row level security;
alter table public.places enable row level security;
alter table public.trips enable row level security;
alter table public.submissions enable row level security;

-- USERS
create policy "users_select_own" on public.users
for select using (auth.uid() = id);

create policy "users_insert_own" on public.users
for insert with check (auth.uid() = id);

create policy "users_update_own" on public.users
for update using (auth.uid() = id) with check (auth.uid() = id);

create policy "users_delete_own" on public.users
for delete using (auth.uid() = id);

-- CHILDREN
create policy "children_select_own" on public.children
for select using (auth.uid() = user_id);

create policy "children_insert_own" on public.children
for insert with check (auth.uid() = user_id);

create policy "children_update_own" on public.children
for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "children_delete_own" on public.children
for delete using (auth.uid() = user_id);

-- PLACES
create policy "places_select_own" on public.places
for select using (auth.uid() = user_id);

create policy "places_insert_own" on public.places
for insert with check (auth.uid() = user_id);

create policy "places_update_own" on public.places
for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "places_delete_own" on public.places
for delete using (auth.uid() = user_id);

-- TRIPS
create policy "trips_select_own" on public.trips
for select using (auth.uid() = user_id);

create policy "trips_insert_own" on public.trips
for insert with check (auth.uid() = user_id);

create policy "trips_update_own" on public.trips
for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "trips_delete_own" on public.trips
for delete using (auth.uid() = user_id);

-- SUBMISSIONS
create policy "submissions_select_own" on public.submissions
for select using (auth.uid() = user_id);

create policy "submissions_insert_own" on public.submissions
for insert with check (auth.uid() = user_id);

create policy "submissions_update_own" on public.submissions
for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "submissions_delete_own" on public.submissions
for delete using (auth.uid() = user_id);
