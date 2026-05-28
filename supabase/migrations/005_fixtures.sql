create table fixtures (
  id uuid primary key default gen_random_uuid(),
  gameweek_id uuid references gameweeks(id) on delete cascade,
  home_team_id uuid references real_teams(id),
  away_team_id uuid references real_teams(id),
  home_score integer,
  away_score integer,
  kickoff_time timestamptz,
  played boolean default false,
  created_at timestamptz default now()
);

alter table fixtures enable row level security;

create policy "Public read fixtures" on fixtures for select using (true);
create policy "Admin insert fixtures" on fixtures for insert with check (
  exists (select 1 from admin_users where user_id = auth.uid())
);
create policy "Admin update fixtures" on fixtures for update using (
  exists (select 1 from admin_users where user_id = auth.uid())
);
create policy "Admin delete fixtures" on fixtures for delete using (
  exists (select 1 from admin_users where user_id = auth.uid())
);
