-- Trip <-> Children join table

create table if not exists public.trip_children (
  trip_id uuid not null references public.trips(id) on delete cascade,
  child_id uuid not null references public.children(id) on delete cascade,
  user_id uuid not null default auth.uid() references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (trip_id, child_id)
);

alter table public.trip_children enable row level security;

create policy "trip_children_select_own" on public.trip_children
for select using (auth.uid() = user_id);

create policy "trip_children_insert_own" on public.trip_children
for insert with check (auth.uid() = user_id);

create policy "trip_children_delete_own" on public.trip_children
for delete using (auth.uid() = user_id);
