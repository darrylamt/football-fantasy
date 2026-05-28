create table player_gameweek_stats (
  id uuid primary key default gen_random_uuid(),
  player_id uuid references players(id) on delete cascade,
  gameweek_id uuid references gameweeks(id) on delete cascade,
  fixture_id uuid references fixtures(id),
  minutes integer default 0,
  goals integer default 0,
  assists integer default 0,
  clean_sheet boolean default false,
  saves integer default 0,
  penalty_saves integer default 0,
  yellow_cards integer default 0,
  red_cards integer default 0,
  own_goals integer default 0,
  bonus integer default 0 check (bonus between 0 and 3),
  calculated_points integer default 0,
  created_at timestamptz default now(),
  unique(player_id, gameweek_id)
);

alter table player_gameweek_stats enable row level security;

create policy "Public read player_gameweek_stats" on player_gameweek_stats for select using (true);
create policy "Admin insert player_gameweek_stats" on player_gameweek_stats for insert with check (
  exists (select 1 from admin_users where user_id = auth.uid())
);
create policy "Admin update player_gameweek_stats" on player_gameweek_stats for update using (
  exists (select 1 from admin_users where user_id = auth.uid())
);
create policy "Admin delete player_gameweek_stats" on player_gameweek_stats for delete using (
  exists (select 1 from admin_users where user_id = auth.uid())
);
