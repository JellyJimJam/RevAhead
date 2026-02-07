-- Trip <-> Children join table

create table if not exists public.trip_children (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  child_id uuid not null references public.children(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (trip_id, child_id)
);

alter table public.trip_children enable row level security;

create policy "trip_children_select_own" on public.trip_children
for select using (
  exists (
    select 1 from public.trips
    where trips.id = trip_children.trip_id
      and trips.user_id = auth.uid()
  )
);

create policy "trip_children_insert_own" on public.trip_children
for insert with check (
  exists (
    select 1 from public.trips
    where trips.id = trip_children.trip_id
      and trips.user_id = auth.uid()
  )
);

create policy "trip_children_delete_own" on public.trip_children
for delete using (
  exists (
    select 1 from public.trips
    where trips.id = trip_children.trip_id
      and trips.user_id = auth.uid()
  )
);
