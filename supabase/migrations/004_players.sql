create table players (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  display_name text,
  position text not null check (position in ('GK', 'DEF', 'MID', 'FWD')),
  team_id uuid references real_teams(id) on delete set null,
  price decimal(4,1) not null default 5.0,
  total_points integer default 0,
  status text default 'available' check (status in ('available', 'injured', 'suspended', 'doubtful')),
  news text,
  created_at timestamptz default now()
);

alter table players enable row level security;

create policy "Public read players" on players for select using (true);
create policy "Admin insert players" on players for insert with check (
  exists (select 1 from admin_users where user_id = auth.uid())
);
create policy "Admin update players" on players for update using (
  exists (select 1 from admin_users where user_id = auth.uid())
);
create policy "Admin delete players" on players for delete using (
  exists (select 1 from admin_users where user_id = auth.uid())
);
