create table chips_used (
  id uuid primary key default gen_random_uuid(),
  fantasy_team_id uuid references fantasy_teams(id) on delete cascade,
  chip text not null check (chip in ('wildcard_1', 'wildcard_2', 'triple_captain', 'bench_boost', 'free_hit')),
  gameweek_id uuid references gameweeks(id),
  created_at timestamptz default now(),
  unique(fantasy_team_id, chip)
);

alter table chips_used enable row level security;

create policy "Owner read chips_used" on chips_used for select using (
  exists (select 1 from fantasy_teams where id = fantasy_team_id and user_id = auth.uid())
);
create policy "Owner insert chips_used" on chips_used for insert with check (
  exists (select 1 from fantasy_teams where id = fantasy_team_id and user_id = auth.uid())
);
create policy "Owner delete chips_used" on chips_used for delete using (
  exists (select 1 from fantasy_teams where id = fantasy_team_id and user_id = auth.uid())
);
