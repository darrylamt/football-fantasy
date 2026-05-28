create table league_members (
  id uuid primary key default gen_random_uuid(),
  league_id uuid references leagues(id) on delete cascade,
  fantasy_team_id uuid references fantasy_teams(id) on delete cascade,
  joined_at timestamptz default now(),
  unique(league_id, fantasy_team_id)
);

alter table league_members enable row level security;

create policy "Public read league_members" on league_members for select using (true);
create policy "Owner insert league_members" on league_members for insert with check (
  exists (select 1 from fantasy_teams where id = fantasy_team_id and user_id = auth.uid())
);
create policy "Owner delete league_members" on league_members for delete using (
  exists (select 1 from fantasy_teams where id = fantasy_team_id and user_id = auth.uid())
);
