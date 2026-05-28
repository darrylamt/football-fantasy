create table h2h_matches (
  id uuid primary key default gen_random_uuid(),
  league_id uuid references leagues(id) on delete cascade,
  gameweek_id uuid references gameweeks(id),
  home_team_id uuid references fantasy_teams(id),
  away_team_id uuid references fantasy_teams(id),
  home_points integer,
  away_points integer,
  created_at timestamptz default now()
);

alter table h2h_matches enable row level security;

create policy "Public read h2h_matches" on h2h_matches for select using (true);
create policy "Admin insert h2h_matches" on h2h_matches for insert with check (
  exists (select 1 from admin_users where user_id = auth.uid())
);
create policy "Admin update h2h_matches" on h2h_matches for update using (
  exists (select 1 from admin_users where user_id = auth.uid())
);
