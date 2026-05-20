create extension if not exists "pgcrypto";

create table if not exists public.properties (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text not null,
  city text not null,
  address text not null,
  price numeric not null check (price > 0),
  bedrooms integer not null check (bedrooms >= 0),
  bathrooms integer not null check (bathrooms >= 0),
  area_sqft integer not null check (area_sqft >= 100),
  image_url text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_properties_city on public.properties(city);
create index if not exists idx_properties_price on public.properties(price);
create index if not exists idx_properties_created_at on public.properties(created_at desc);

alter table public.properties enable row level security;

create policy "Anyone can read properties"
  on public.properties
  for select
  using (true);

create policy "Authenticated users can insert properties"
  on public.properties
  for insert
  to authenticated
  with check (auth.uid() = owner_id);

create policy "Owner can update own properties"
  on public.properties
  for update
  to authenticated
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

create policy "Owner can delete own properties"
  on public.properties
  for delete
  to authenticated
  using (auth.uid() = owner_id);