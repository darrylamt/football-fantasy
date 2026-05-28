create table fantasy_teams (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  season_id uuid references seasons(id),
  name text not null,
  total_points integer default 0,
  overall_rank integer,
  free_transfers integer default 1,
  bank decimal(4,1) default 0.0,
  created_at timestamptz default now(),
  unique(user_id, season_id)
);

alter table fantasy_teams enable row level security;

create policy "Public read fantasy_teams" on fantasy_teams for select using (true);
create policy "Owner insert fantasy_teams" on fantasy_teams for insert with check (auth.uid() = user_id);
create policy "Owner update fantasy_teams" on fantasy_teams for update using (auth.uid() = user_id);
create policy "Owner delete fantasy_teams" on fantasy_teams for delete using (auth.uid() = user_id);
