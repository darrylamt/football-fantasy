create table fantasy_picks (
  id uuid primary key default gen_random_uuid(),
  fantasy_team_id uuid references fantasy_teams(id) on delete cascade,
  gameweek_id uuid references gameweeks(id) on delete cascade,
  player_id uuid references players(id),
  is_starting boolean default true,
  bench_order integer,
  is_captain boolean default false,
  is_vice_captain boolean default false,
  points_scored integer default 0,
  created_at timestamptz default now(),
  unique(fantasy_team_id, gameweek_id, player_id)
);

alter table fantasy_picks enable row level security;

create policy "Public read fantasy_picks" on fantasy_picks for select using (true);
create policy "Owner insert fantasy_picks" on fantasy_picks for insert with check (
  exists (select 1 from fantasy_teams where id = fantasy_team_id and user_id = auth.uid())
);
create policy "Owner update fantasy_picks" on fantasy_picks for update using (
  exists (select 1 from fantasy_teams where id = fantasy_team_id and user_id = auth.uid())
);
create policy "Owner delete fantasy_picks" on fantasy_picks for delete using (
  exists (select 1 from fantasy_teams where id = fantasy_team_id and user_id = auth.uid())
);
