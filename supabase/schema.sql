-- ============================================================
-- Ghana Fantasy Football — Full Schema + Seed
-- Run this once in the Supabase SQL Editor
-- ============================================================


-- ============================================================
-- 000: Admin Users
-- Must be created first — all other admin policies reference it
-- ============================================================

create table admin_users (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade unique,
  created_at timestamptz default now()
);

alter table admin_users enable row level security;

create policy "Admin read admin_users" on admin_users for select using (
  auth.uid() = user_id
);


-- ============================================================
-- 001: Seasons
-- ============================================================

create table seasons (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  is_active boolean default false,
  created_at timestamptz default now()
);

alter table seasons enable row level security;

create policy "Public read seasons" on seasons for select using (true);
create policy "Admin insert seasons" on seasons for insert with check (
  exists (select 1 from admin_users where user_id = auth.uid())
);
create policy "Admin update seasons" on seasons for update using (
  exists (select 1 from admin_users where user_id = auth.uid())
);
create policy "Admin delete seasons" on seasons for delete using (
  exists (select 1 from admin_users where user_id = auth.uid())
);


-- ============================================================
-- 002: Gameweeks
-- ============================================================

create table gameweeks (
  id uuid primary key default gen_random_uuid(),
  season_id uuid references seasons(id) on delete cascade,
  number integer not null,
  deadline timestamptz not null,
  status text not null default 'upcoming' check (status in ('upcoming', 'active', 'finished')),
  is_current boolean default false,
  created_at timestamptz default now()
);

alter table gameweeks enable row level security;

create policy "Public read gameweeks" on gameweeks for select using (true);
create policy "Admin insert gameweeks" on gameweeks for insert with check (
  exists (select 1 from admin_users where user_id = auth.uid())
);
create policy "Admin update gameweeks" on gameweeks for update using (
  exists (select 1 from admin_users where user_id = auth.uid())
);
create policy "Admin delete gameweeks" on gameweeks for delete using (
  exists (select 1 from admin_users where user_id = auth.uid())
);


-- ============================================================
-- 003: Real Teams
-- ============================================================

create table real_teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  short_name text not null,
  badge_url text,
  primary_color text default '#4ade80',
  created_at timestamptz default now()
);

alter table real_teams enable row level security;

create policy "Public read real_teams" on real_teams for select using (true);
create policy "Admin insert real_teams" on real_teams for insert with check (
  exists (select 1 from admin_users where user_id = auth.uid())
);
create policy "Admin update real_teams" on real_teams for update using (
  exists (select 1 from admin_users where user_id = auth.uid())
);
create policy "Admin delete real_teams" on real_teams for delete using (
  exists (select 1 from admin_users where user_id = auth.uid())
);


-- ============================================================
-- 004: Players
-- ============================================================

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


-- ============================================================
-- 005: Fixtures
-- ============================================================

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


-- ============================================================
-- 006: Player Gameweek Stats
-- ============================================================

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


-- ============================================================
-- 007: Fantasy Teams
-- ============================================================

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


-- ============================================================
-- 008: Fantasy Picks
-- ============================================================

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


-- ============================================================
-- 009: Transfers
-- ============================================================

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


-- ============================================================
-- 010: Chips Used
-- ============================================================

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


-- ============================================================
-- 011: Leagues
-- ============================================================

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


-- ============================================================
-- 012: League Members
-- ============================================================

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


-- ============================================================
-- 013: H2H Matches
-- ============================================================

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


-- ============================================================
-- 014: Seed Data
-- ============================================================

-- Active season
insert into seasons (name, is_active) values ('2024/25 Season', true);

-- Real teams (Ghana Premier League clubs)
insert into real_teams (name, short_name, primary_color) values
  ('Hearts of Oak', 'HOA', '#CC0000'),
  ('Asante Kotoko', 'KOT', '#B8191A'),
  ('Medeama SC', 'MED', '#FFD700'),
  ('Aduana Stars', 'ADU', '#FF6600'),
  ('Dreams FC', 'DRM', '#0066CC'),
  ('Bechem United', 'BEC', '#006400');

-- Gameweeks (GW1 active, GW2 upcoming)
insert into gameweeks (season_id, number, deadline, status, is_current)
select s.id, 1, now() + interval '7 days', 'active', true
from seasons s where s.is_active = true;

insert into gameweeks (season_id, number, deadline, status, is_current)
select s.id, 2, now() + interval '14 days', 'upcoming', false
from seasons s where s.is_active = true;

-- Players (30 players across positions and teams)
insert into players (name, display_name, position, team_id, price, status)
select p.name, p.display_name, p.position, t.id, p.price, 'available'
from (values
  ('Richard Attah',          'Attah',       'GK',  'Hearts of Oak',  4.5),
  ('Caleb Amankwah',         'Amankwah',    'DEF', 'Hearts of Oak',  5.0),
  ('Mohammed Alhassan',      'Alhassan',    'DEF', 'Hearts of Oak',  4.5),
  ('Konadu Yiadom',          'Yiadom',      'MID', 'Hearts of Oak',  6.0),
  ('Daniel Afriyie',         'Afriyie',     'FWD', 'Hearts of Oak',  7.5),
  ('Danlad Ibrahim',         'Danlad',      'GK',  'Asante Kotoko',  5.0),
  ('Ismail Ganiu',           'Ganiu',       'DEF', 'Asante Kotoko',  5.5),
  ('Enoch Asubonteng',       'Asubonteng',  'DEF', 'Asante Kotoko',  4.5),
  ('Mudasiru Salifu',        'Mudasiru',    'MID', 'Asante Kotoko',  7.0),
  ('Frank Mbella',           'Mbella',      'FWD', 'Asante Kotoko',  8.0),
  ('Eric Ofori Antwi',       'Antwi',       'GK',  'Medeama SC',     4.0),
  ('Justice Blay',           'Blay',        'DEF', 'Medeama SC',     5.0),
  ('Kwasi Donsu',            'Donsu',       'MID', 'Medeama SC',     6.5),
  ('Amos Leahy',             'Leahy',       'MID', 'Medeama SC',     5.5),
  ('Prince Opoku Agyemang',  'P. Agyemang', 'FWD', 'Medeama SC',     7.0),
  ('Danlad Ayuba',           'Ayuba',       'GK',  'Aduana Stars',   4.0),
  ('Bright Adjei',           'B. Adjei',    'DEF', 'Aduana Stars',   4.5),
  ('Fatawu Issahaku',        'Issahaku',    'MID', 'Aduana Stars',   7.5),
  ('Emmanuel Gyamfi',        'Gyamfi',      'MID', 'Aduana Stars',   6.0),
  ('Bright Enchil',          'Enchil',      'FWD', 'Aduana Stars',   6.5),
  ('Stephen Adams',          'Adams',       'GK',  'Dreams FC',      4.5),
  ('Philemon Baffour',       'Baffour',     'DEF', 'Dreams FC',      5.0),
  ('Sampson Agyapong',       'Agyapong',    'DEF', 'Dreams FC',      4.5),
  ('John Antwi',             'J. Antwi',    'MID', 'Dreams FC',      5.5),
  ('Sadiq Ibrahim',          'Sadiq',       'FWD', 'Dreams FC',      6.5),
  ('Kofi Baah',              'K. Baah',     'GK',  'Bechem United',  4.0),
  ('Hafiz Konkoni',          'Konkoni',     'DEF', 'Bechem United',  5.0),
  ('Samuel Rocha',           'Rocha',       'MID', 'Bechem United',  6.0),
  ('Kofi Agbesimah',         'Agbesimah',   'MID', 'Bechem United',  5.5),
  ('Benjamin Tweneboah',     'Tweneboah',   'FWD', 'Bechem United',  7.0)
) as p(name, display_name, position, team_name, price)
join real_teams t on t.name = p.team_name;

-- ============================================================
-- FINAL STEP: Make yourself an admin
-- 1. Create your account via the app's /register page (or Supabase Auth dashboard)
-- 2. Find your UUID in Supabase → Authentication → Users
-- 3. Uncomment and run this line with your actual UUID:
-- ============================================================
-- insert into admin_users (user_id) values ('YOUR-USER-UUID-HERE');
