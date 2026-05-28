create table transfers (
  id uuid primary key default gen_random_uuid(),
  fantasy_team_id uuid references fantasy_teams(id) on delete cascade,
  gameweek_id uuid references gameweeks(id),
  player_in_id uuid references players(id),
  player_out_id uuid references players(id),
  player_in_price decimal(4,1),
  player_out_price decimal(4,1),
  transfer_cost integer default 0,
  created_at timestamptz default now()
);

alter table transfers enable row level security;

create policy "Owner read transfers" on transfers for select using (
  exists (select 1 from fantasy_teams where id = fantasy_team_id and user_id = auth.uid())
);
create policy "Owner insert transfers" on transfers for insert with check (
  exists (select 1 from fantasy_teams where id = fantasy_team_id and user_id = auth.uid())
);
