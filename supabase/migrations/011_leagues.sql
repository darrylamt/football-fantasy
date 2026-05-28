create table leagues (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null check (type in ('classic', 'h2h')),
  code text unique not null,
  created_by uuid references auth.users(id),
  season_id uuid references seasons(id),
  created_at timestamptz default now()
);

alter table leagues enable row level security;

create policy "Public read leagues" on leagues for select using (true);
create policy "Auth insert leagues" on leagues for insert with check (auth.uid() = created_by);
create policy "Owner update leagues" on leagues for update using (auth.uid() = created_by);
create policy "Owner delete leagues" on leagues for delete using (auth.uid() = created_by);
