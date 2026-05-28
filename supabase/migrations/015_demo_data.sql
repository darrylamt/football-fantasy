-- ============================================================
-- 015: Demo Data
-- Run this AFTER the schema.sql (which includes 014_seed)
--
-- What this does:
--  • GW1 → finished, with 3 played fixtures + full player stats
--  • GW2 → active / current (deadline in 3 days, 3 upcoming fixtures)
--  • GW3 → upcoming (3 fixtures scheduled)
--  • All player total_points updated from GW1 stats
--  • Demo fantasy team — uncomment section at the bottom and
--    replace YOUR-USER-UUID-HERE with your UUID from Supabase Auth
-- ============================================================


-- ============================================================
-- STEP 1: Fix gameweek statuses
-- ============================================================

update gameweeks
set status = 'finished', is_current = false
where number = 1
  and season_id = (select id from seasons where is_active = true);

update gameweeks
set status = 'active', is_current = true, deadline = now() + interval '3 days'
where number = 2
  and season_id = (select id from seasons where is_active = true);


-- ============================================================
-- STEP 2: Add GW3
-- ============================================================

insert into gameweeks (season_id, number, deadline, status, is_current)
select id, 3, now() + interval '17 days', 'upcoming', false
from seasons where is_active = true;


-- ============================================================
-- STEP 3: GW1 fixtures — all played
-- HOA 2-1 KOT | MED 0-0 DRM | ADU 3-1 BEC
-- ============================================================

insert into fixtures (gameweek_id, home_team_id, away_team_id, kickoff_time, home_score, away_score, played)
select
  (select id from gameweeks where number = 1 and season_id = (select id from seasons where is_active = true)),
  (select id from real_teams where short_name = 'HOA'),
  (select id from real_teams where short_name = 'KOT'),
  now() - interval '8 days', 2, 1, true;

insert into fixtures (gameweek_id, home_team_id, away_team_id, kickoff_time, home_score, away_score, played)
select
  (select id from gameweeks where number = 1 and season_id = (select id from seasons where is_active = true)),
  (select id from real_teams where short_name = 'MED'),
  (select id from real_teams where short_name = 'DRM'),
  now() - interval '8 days', 0, 0, true;

insert into fixtures (gameweek_id, home_team_id, away_team_id, kickoff_time, home_score, away_score, played)
select
  (select id from gameweeks where number = 1 and season_id = (select id from seasons where is_active = true)),
  (select id from real_teams where short_name = 'ADU'),
  (select id from real_teams where short_name = 'BEC'),
  now() - interval '7 days', 3, 1, true;


-- ============================================================
-- STEP 4: GW2 fixtures — not played yet
-- HOA vs MED | KOT vs ADU | DRM vs BEC
-- ============================================================

insert into fixtures (gameweek_id, home_team_id, away_team_id, kickoff_time, played)
select
  (select id from gameweeks where number = 2 and season_id = (select id from seasons where is_active = true)),
  (select id from real_teams where short_name = 'HOA'),
  (select id from real_teams where short_name = 'MED'),
  now() + interval '2 days', false;

insert into fixtures (gameweek_id, home_team_id, away_team_id, kickoff_time, played)
select
  (select id from gameweeks where number = 2 and season_id = (select id from seasons where is_active = true)),
  (select id from real_teams where short_name = 'KOT'),
  (select id from real_teams where short_name = 'ADU'),
  now() + interval '2 days', false;

insert into fixtures (gameweek_id, home_team_id, away_team_id, kickoff_time, played)
select
  (select id from gameweeks where number = 2 and season_id = (select id from seasons where is_active = true)),
  (select id from real_teams where short_name = 'DRM'),
  (select id from real_teams where short_name = 'BEC'),
  now() + interval '3 days', false;


-- ============================================================
-- STEP 5: GW3 fixtures — further future
-- KOT vs HOA | ADU vs MED | BEC vs DRM
-- ============================================================

insert into fixtures (gameweek_id, home_team_id, away_team_id, kickoff_time, played)
select
  (select id from gameweeks where number = 3 and season_id = (select id from seasons where is_active = true)),
  (select id from real_teams where short_name = 'KOT'),
  (select id from real_teams where short_name = 'HOA'),
  now() + interval '16 days', false;

insert into fixtures (gameweek_id, home_team_id, away_team_id, kickoff_time, played)
select
  (select id from gameweeks where number = 3 and season_id = (select id from seasons where is_active = true)),
  (select id from real_teams where short_name = 'ADU'),
  (select id from real_teams where short_name = 'MED'),
  now() + interval '16 days', false;

insert into fixtures (gameweek_id, home_team_id, away_team_id, kickoff_time, played)
select
  (select id from gameweeks where number = 3 and season_id = (select id from seasons where is_active = true)),
  (select id from real_teams where short_name = 'BEC'),
  (select id from real_teams where short_name = 'DRM'),
  now() + interval '17 days', false;


-- ============================================================
-- STEP 6: GW1 player stats
-- Points system:
--   mins≥60=2, mins≥1=1 | Goals: GK/DEF=6, MID=5, FWD=4
--   Assists=3 | CS (60+): GK/DEF=4, MID=1 | Saves: 1pt/3
--   Pen save=5 | YC=-1 | RC=-3 | OG=-2 | Bonus=+bonus
-- ============================================================

-- Helper: get GW1 id and fixture ids
-- HOA 2-1 KOT
-- Attah (GK, HOA): 90 min, 3 saves → 2 + 1 = 3 pts
insert into player_gameweek_stats
  (player_id, gameweek_id, fixture_id, minutes, goals, assists, clean_sheet, saves, penalty_saves, yellow_cards, red_cards, own_goals, bonus, calculated_points)
select p.id,
  (select id from gameweeks where number=1 and season_id=(select id from seasons where is_active=true)),
  (select f.id from fixtures f
     join real_teams ht on f.home_team_id=ht.id join real_teams at on f.away_team_id=at.id
     where ht.short_name='HOA' and at.short_name='KOT'
     and f.gameweek_id=(select id from gameweeks where number=1 and season_id=(select id from seasons where is_active=true))),
  90, 0, 0, false, 3, 0, 0, 0, 0, 0, 3
from players p where p.name='Richard Attah';

-- Amankwah (DEF, HOA): 90 min, no CS → 2 pts
insert into player_gameweek_stats
  (player_id, gameweek_id, fixture_id, minutes, goals, assists, clean_sheet, saves, penalty_saves, yellow_cards, red_cards, own_goals, bonus, calculated_points)
select p.id,
  (select id from gameweeks where number=1 and season_id=(select id from seasons where is_active=true)),
  (select f.id from fixtures f join real_teams ht on f.home_team_id=ht.id join real_teams at on f.away_team_id=at.id where ht.short_name='HOA' and at.short_name='KOT' and f.gameweek_id=(select id from gameweeks where number=1 and season_id=(select id from seasons where is_active=true))),
  90, 0, 0, false, 0, 0, 0, 0, 0, 0, 2
from players p where p.name='Caleb Amankwah';

-- Alhassan (DEF, HOA): 90 min, no CS → 2 pts
insert into player_gameweek_stats
  (player_id, gameweek_id, fixture_id, minutes, goals, assists, clean_sheet, saves, penalty_saves, yellow_cards, red_cards, own_goals, bonus, calculated_points)
select p.id,
  (select id from gameweeks where number=1 and season_id=(select id from seasons where is_active=true)),
  (select f.id from fixtures f join real_teams ht on f.home_team_id=ht.id join real_teams at on f.away_team_id=at.id where ht.short_name='HOA' and at.short_name='KOT' and f.gameweek_id=(select id from gameweeks where number=1 and season_id=(select id from seasons where is_active=true))),
  90, 0, 0, false, 0, 0, 0, 0, 0, 0, 2
from players p where p.name='Mohammed Alhassan';

-- Yiadom (MID, HOA): 90 min, 1 assist, no CS → 5 pts
insert into player_gameweek_stats
  (player_id, gameweek_id, fixture_id, minutes, goals, assists, clean_sheet, saves, penalty_saves, yellow_cards, red_cards, own_goals, bonus, calculated_points)
select p.id,
  (select id from gameweeks where number=1 and season_id=(select id from seasons where is_active=true)),
  (select f.id from fixtures f join real_teams ht on f.home_team_id=ht.id join real_teams at on f.away_team_id=at.id where ht.short_name='HOA' and at.short_name='KOT' and f.gameweek_id=(select id from gameweeks where number=1 and season_id=(select id from seasons where is_active=true))),
  90, 0, 1, false, 0, 0, 0, 0, 0, 0, 5
from players p where p.name='Konadu Yiadom';

-- Afriyie (FWD, HOA): 90 min, 2 goals, 1 bonus → 2+8+1 = 11 pts ... let's say 2 bonus → 12 pts
insert into player_gameweek_stats
  (player_id, gameweek_id, fixture_id, minutes, goals, assists, clean_sheet, saves, penalty_saves, yellow_cards, red_cards, own_goals, bonus, calculated_points)
select p.id,
  (select id from gameweeks where number=1 and season_id=(select id from seasons where is_active=true)),
  (select f.id from fixtures f join real_teams ht on f.home_team_id=ht.id join real_teams at on f.away_team_id=at.id where ht.short_name='HOA' and at.short_name='KOT' and f.gameweek_id=(select id from gameweeks where number=1 and season_id=(select id from seasons where is_active=true))),
  90, 2, 0, false, 0, 0, 0, 0, 0, 2, 12
from players p where p.name='Daniel Afriyie';

-- Danlad Ibrahim (GK, KOT): 90 min, conceded 2, 1 save → 2 pts
insert into player_gameweek_stats
  (player_id, gameweek_id, fixture_id, minutes, goals, assists, clean_sheet, saves, penalty_saves, yellow_cards, red_cards, own_goals, bonus, calculated_points)
select p.id,
  (select id from gameweeks where number=1 and season_id=(select id from seasons where is_active=true)),
  (select f.id from fixtures f join real_teams ht on f.home_team_id=ht.id join real_teams at on f.away_team_id=at.id where ht.short_name='HOA' and at.short_name='KOT' and f.gameweek_id=(select id from gameweeks where number=1 and season_id=(select id from seasons where is_active=true))),
  90, 0, 0, false, 1, 0, 0, 0, 0, 0, 2
from players p where p.name='Danlad Ibrahim';

-- Ganiu (DEF, KOT): 90 min, no CS → 2 pts
insert into player_gameweek_stats
  (player_id, gameweek_id, fixture_id, minutes, goals, assists, clean_sheet, saves, penalty_saves, yellow_cards, red_cards, own_goals, bonus, calculated_points)
select p.id,
  (select id from gameweeks where number=1 and season_id=(select id from seasons where is_active=true)),
  (select f.id from fixtures f join real_teams ht on f.home_team_id=ht.id join real_teams at on f.away_team_id=at.id where ht.short_name='HOA' and at.short_name='KOT' and f.gameweek_id=(select id from gameweeks where number=1 and season_id=(select id from seasons where is_active=true))),
  90, 0, 0, false, 0, 0, 0, 0, 0, 0, 2
from players p where p.name='Ismail Ganiu';

-- Asubonteng (DEF, KOT): 90 min, no CS → 2 pts
insert into player_gameweek_stats
  (player_id, gameweek_id, fixture_id, minutes, goals, assists, clean_sheet, saves, penalty_saves, yellow_cards, red_cards, own_goals, bonus, calculated_points)
select p.id,
  (select id from gameweeks where number=1 and season_id=(select id from seasons where is_active=true)),
  (select f.id from fixtures f join real_teams ht on f.home_team_id=ht.id join real_teams at on f.away_team_id=at.id where ht.short_name='HOA' and at.short_name='KOT' and f.gameweek_id=(select id from gameweeks where number=1 and season_id=(select id from seasons where is_active=true))),
  90, 0, 0, false, 0, 0, 0, 0, 0, 0, 2
from players p where p.name='Enoch Asubonteng';

-- Mudasiru (MID, KOT): 90 min, 1 assist, 1 bonus → 5+1 = 6 pts
insert into player_gameweek_stats
  (player_id, gameweek_id, fixture_id, minutes, goals, assists, clean_sheet, saves, penalty_saves, yellow_cards, red_cards, own_goals, bonus, calculated_points)
select p.id,
  (select id from gameweeks where number=1 and season_id=(select id from seasons where is_active=true)),
  (select f.id from fixtures f join real_teams ht on f.home_team_id=ht.id join real_teams at on f.away_team_id=at.id where ht.short_name='HOA' and at.short_name='KOT' and f.gameweek_id=(select id from gameweeks where number=1 and season_id=(select id from seasons where is_active=true))),
  90, 0, 1, false, 0, 0, 0, 0, 0, 1, 6
from players p where p.name='Mudasiru Salifu';

-- Mbella (FWD, KOT): 90 min, 1 goal, 3 bonus → 2+4+3 = 9 pts
insert into player_gameweek_stats
  (player_id, gameweek_id, fixture_id, minutes, goals, assists, clean_sheet, saves, penalty_saves, yellow_cards, red_cards, own_goals, bonus, calculated_points)
select p.id,
  (select id from gameweeks where number=1 and season_id=(select id from seasons where is_active=true)),
  (select f.id from fixtures f join real_teams ht on f.home_team_id=ht.id join real_teams at on f.away_team_id=at.id where ht.short_name='HOA' and at.short_name='KOT' and f.gameweek_id=(select id from gameweeks where number=1 and season_id=(select id from seasons where is_active=true))),
  90, 1, 0, false, 0, 0, 0, 0, 0, 3, 9
from players p where p.name='Frank Mbella';

-- ---- MED 0-0 DRM ---- clean sheets for everyone who played 60+ mins

-- Antwi (GK, MED): 90 min, CS, 4 saves → 2+4+1+1bonus = 8 pts
insert into player_gameweek_stats
  (player_id, gameweek_id, fixture_id, minutes, goals, assists, clean_sheet, saves, penalty_saves, yellow_cards, red_cards, own_goals, bonus, calculated_points)
select p.id,
  (select id from gameweeks where number=1 and season_id=(select id from seasons where is_active=true)),
  (select f.id from fixtures f join real_teams ht on f.home_team_id=ht.id join real_teams at on f.away_team_id=at.id where ht.short_name='MED' and at.short_name='DRM' and f.gameweek_id=(select id from gameweeks where number=1 and season_id=(select id from seasons where is_active=true))),
  90, 0, 0, true, 4, 0, 0, 0, 0, 1, 8
from players p where p.name='Eric Ofori Antwi';

-- Blay (DEF, MED): 90 min, CS → 2+4 = 6 pts
insert into player_gameweek_stats
  (player_id, gameweek_id, fixture_id, minutes, goals, assists, clean_sheet, saves, penalty_saves, yellow_cards, red_cards, own_goals, bonus, calculated_points)
select p.id,
  (select id from gameweeks where number=1 and season_id=(select id from seasons where is_active=true)),
  (select f.id from fixtures f join real_teams ht on f.home_team_id=ht.id join real_teams at on f.away_team_id=at.id where ht.short_name='MED' and at.short_name='DRM' and f.gameweek_id=(select id from gameweeks where number=1 and season_id=(select id from seasons where is_active=true))),
  90, 0, 0, true, 0, 0, 0, 0, 0, 0, 6
from players p where p.name='Justice Blay';

-- Donsu (MID, MED): 90 min, CS → 2+1 = 3 pts
insert into player_gameweek_stats
  (player_id, gameweek_id, fixture_id, minutes, goals, assists, clean_sheet, saves, penalty_saves, yellow_cards, red_cards, own_goals, bonus, calculated_points)
select p.id,
  (select id from gameweeks where number=1 and season_id=(select id from seasons where is_active=true)),
  (select f.id from fixtures f join real_teams ht on f.home_team_id=ht.id join real_teams at on f.away_team_id=at.id where ht.short_name='MED' and at.short_name='DRM' and f.gameweek_id=(select id from gameweeks where number=1 and season_id=(select id from seasons where is_active=true))),
  90, 0, 0, true, 0, 0, 0, 0, 0, 0, 3
from players p where p.name='Kwasi Donsu';

-- Leahy (MID, MED): 90 min, CS → 2+1 = 3 pts
insert into player_gameweek_stats
  (player_id, gameweek_id, fixture_id, minutes, goals, assists, clean_sheet, saves, penalty_saves, yellow_cards, red_cards, own_goals, bonus, calculated_points)
select p.id,
  (select id from gameweeks where number=1 and season_id=(select id from seasons where is_active=true)),
  (select f.id from fixtures f join real_teams ht on f.home_team_id=ht.id join real_teams at on f.away_team_id=at.id where ht.short_name='MED' and at.short_name='DRM' and f.gameweek_id=(select id from gameweeks where number=1 and season_id=(select id from seasons where is_active=true))),
  90, 0, 0, true, 0, 0, 0, 0, 0, 0, 3
from players p where p.name='Amos Leahy';

-- P. Agyemang (FWD, MED): 90 min, CS (FWD gets 0 CS pts) → 2 pts
insert into player_gameweek_stats
  (player_id, gameweek_id, fixture_id, minutes, goals, assists, clean_sheet, saves, penalty_saves, yellow_cards, red_cards, own_goals, bonus, calculated_points)
select p.id,
  (select id from gameweeks where number=1 and season_id=(select id from seasons where is_active=true)),
  (select f.id from fixtures f join real_teams ht on f.home_team_id=ht.id join real_teams at on f.away_team_id=at.id where ht.short_name='MED' and at.short_name='DRM' and f.gameweek_id=(select id from gameweeks where number=1 and season_id=(select id from seasons where is_active=true))),
  90, 0, 0, true, 0, 0, 0, 0, 0, 0, 2
from players p where p.name='Prince Opoku Agyemang';

-- Adams (GK, DRM): 90 min, CS, 2 saves → 2+4 = 6 pts
insert into player_gameweek_stats
  (player_id, gameweek_id, fixture_id, minutes, goals, assists, clean_sheet, saves, penalty_saves, yellow_cards, red_cards, own_goals, bonus, calculated_points)
select p.id,
  (select id from gameweeks where number=1 and season_id=(select id from seasons where is_active=true)),
  (select f.id from fixtures f join real_teams ht on f.home_team_id=ht.id join real_teams at on f.away_team_id=at.id where ht.short_name='MED' and at.short_name='DRM' and f.gameweek_id=(select id from gameweeks where number=1 and season_id=(select id from seasons where is_active=true))),
  90, 0, 0, true, 2, 0, 0, 0, 0, 0, 6
from players p where p.name='Stephen Adams';

-- Baffour (DEF, DRM): 90 min, CS → 6 pts
insert into player_gameweek_stats
  (player_id, gameweek_id, fixture_id, minutes, goals, assists, clean_sheet, saves, penalty_saves, yellow_cards, red_cards, own_goals, bonus, calculated_points)
select p.id,
  (select id from gameweeks where number=1 and season_id=(select id from seasons where is_active=true)),
  (select f.id from fixtures f join real_teams ht on f.home_team_id=ht.id join real_teams at on f.away_team_id=at.id where ht.short_name='MED' and at.short_name='DRM' and f.gameweek_id=(select id from gameweeks where number=1 and season_id=(select id from seasons where is_active=true))),
  90, 0, 0, true, 0, 0, 0, 0, 0, 0, 6
from players p where p.name='Philemon Baffour';

-- Agyapong (DEF, DRM): 90 min, CS → 6 pts
insert into player_gameweek_stats
  (player_id, gameweek_id, fixture_id, minutes, goals, assists, clean_sheet, saves, penalty_saves, yellow_cards, red_cards, own_goals, bonus, calculated_points)
select p.id,
  (select id from gameweeks where number=1 and season_id=(select id from seasons where is_active=true)),
  (select f.id from fixtures f join real_teams ht on f.home_team_id=ht.id join real_teams at on f.away_team_id=at.id where ht.short_name='MED' and at.short_name='DRM' and f.gameweek_id=(select id from gameweeks where number=1 and season_id=(select id from seasons where is_active=true))),
  90, 0, 0, true, 0, 0, 0, 0, 0, 0, 6
from players p where p.name='Sampson Agyapong';

-- J. Antwi (MID, DRM): 90 min, CS → 2+1 = 3 pts
insert into player_gameweek_stats
  (player_id, gameweek_id, fixture_id, minutes, goals, assists, clean_sheet, saves, penalty_saves, yellow_cards, red_cards, own_goals, bonus, calculated_points)
select p.id,
  (select id from gameweeks where number=1 and season_id=(select id from seasons where is_active=true)),
  (select f.id from fixtures f join real_teams ht on f.home_team_id=ht.id join real_teams at on f.away_team_id=at.id where ht.short_name='MED' and at.short_name='DRM' and f.gameweek_id=(select id from gameweeks where number=1 and season_id=(select id from seasons where is_active=true))),
  90, 0, 0, true, 0, 0, 0, 0, 0, 0, 3
from players p where p.name='John Antwi';

-- Sadiq (FWD, DRM): 90 min → 2 pts
insert into player_gameweek_stats
  (player_id, gameweek_id, fixture_id, minutes, goals, assists, clean_sheet, saves, penalty_saves, yellow_cards, red_cards, own_goals, bonus, calculated_points)
select p.id,
  (select id from gameweeks where number=1 and season_id=(select id from seasons where is_active=true)),
  (select f.id from fixtures f join real_teams ht on f.home_team_id=ht.id join real_teams at on f.away_team_id=at.id where ht.short_name='MED' and at.short_name='DRM' and f.gameweek_id=(select id from gameweeks where number=1 and season_id=(select id from seasons where is_active=true))),
  90, 0, 0, true, 0, 0, 0, 0, 0, 0, 2
from players p where p.name='Sadiq Ibrahim';

-- ---- ADU 3-1 BEC ----

-- Ayuba (GK, ADU): 90 min, no CS (conceded 1) → 2 pts
insert into player_gameweek_stats
  (player_id, gameweek_id, fixture_id, minutes, goals, assists, clean_sheet, saves, penalty_saves, yellow_cards, red_cards, own_goals, bonus, calculated_points)
select p.id,
  (select id from gameweeks where number=1 and season_id=(select id from seasons where is_active=true)),
  (select f.id from fixtures f join real_teams ht on f.home_team_id=ht.id join real_teams at on f.away_team_id=at.id where ht.short_name='ADU' and at.short_name='BEC' and f.gameweek_id=(select id from gameweeks where number=1 and season_id=(select id from seasons where is_active=true))),
  90, 0, 0, false, 2, 0, 0, 0, 0, 0, 2
from players p where p.name='Danlad Ayuba';

-- B. Adjei (DEF, ADU): 90 min, no CS → 2 pts
insert into player_gameweek_stats
  (player_id, gameweek_id, fixture_id, minutes, goals, assists, clean_sheet, saves, penalty_saves, yellow_cards, red_cards, own_goals, bonus, calculated_points)
select p.id,
  (select id from gameweeks where number=1 and season_id=(select id from seasons where is_active=true)),
  (select f.id from fixtures f join real_teams ht on f.home_team_id=ht.id join real_teams at on f.away_team_id=at.id where ht.short_name='ADU' and at.short_name='BEC' and f.gameweek_id=(select id from gameweeks where number=1 and season_id=(select id from seasons where is_active=true))),
  90, 0, 0, false, 0, 0, 0, 0, 0, 0, 2
from players p where p.name='Bright Adjei';

-- Issahaku (MID, ADU): 90 min, 2 goals, 3 bonus → 2+10+3 = 15 pts ⭐
insert into player_gameweek_stats
  (player_id, gameweek_id, fixture_id, minutes, goals, assists, clean_sheet, saves, penalty_saves, yellow_cards, red_cards, own_goals, bonus, calculated_points)
select p.id,
  (select id from gameweeks where number=1 and season_id=(select id from seasons where is_active=true)),
  (select f.id from fixtures f join real_teams ht on f.home_team_id=ht.id join real_teams at on f.away_team_id=at.id where ht.short_name='ADU' and at.short_name='BEC' and f.gameweek_id=(select id from gameweeks where number=1 and season_id=(select id from seasons where is_active=true))),
  90, 2, 0, false, 0, 0, 0, 0, 0, 3, 15
from players p where p.name='Fatawu Issahaku';

-- Gyamfi (MID, ADU): 90 min, 2 assists, 1 bonus → 2+6+1 = 9 pts
insert into player_gameweek_stats
  (player_id, gameweek_id, fixture_id, minutes, goals, assists, clean_sheet, saves, penalty_saves, yellow_cards, red_cards, own_goals, bonus, calculated_points)
select p.id,
  (select id from gameweeks where number=1 and season_id=(select id from seasons where is_active=true)),
  (select f.id from fixtures f join real_teams ht on f.home_team_id=ht.id join real_teams at on f.away_team_id=at.id where ht.short_name='ADU' and at.short_name='BEC' and f.gameweek_id=(select id from gameweeks where number=1 and season_id=(select id from seasons where is_active=true))),
  90, 0, 2, false, 0, 0, 0, 0, 0, 1, 9
from players p where p.name='Emmanuel Gyamfi';

-- Enchil (FWD, ADU): 90 min, 1 goal, 2 bonus → 2+4+2 = 8 pts
insert into player_gameweek_stats
  (player_id, gameweek_id, fixture_id, minutes, goals, assists, clean_sheet, saves, penalty_saves, yellow_cards, red_cards, own_goals, bonus, calculated_points)
select p.id,
  (select id from gameweeks where number=1 and season_id=(select id from seasons where is_active=true)),
  (select f.id from fixtures f join real_teams ht on f.home_team_id=ht.id join real_teams at on f.away_team_id=at.id where ht.short_name='ADU' and at.short_name='BEC' and f.gameweek_id=(select id from gameweeks where number=1 and season_id=(select id from seasons where is_active=true))),
  90, 1, 0, false, 0, 0, 0, 0, 0, 2, 8
from players p where p.name='Bright Enchil';

-- K. Baah (GK, BEC): 90 min, conceded 3, no CS → 2 pts
insert into player_gameweek_stats
  (player_id, gameweek_id, fixture_id, minutes, goals, assists, clean_sheet, saves, penalty_saves, yellow_cards, red_cards, own_goals, bonus, calculated_points)
select p.id,
  (select id from gameweeks where number=1 and season_id=(select id from seasons where is_active=true)),
  (select f.id from fixtures f join real_teams ht on f.home_team_id=ht.id join real_teams at on f.away_team_id=at.id where ht.short_name='ADU' and at.short_name='BEC' and f.gameweek_id=(select id from gameweeks where number=1 and season_id=(select id from seasons where is_active=true))),
  90, 0, 0, false, 3, 0, 0, 0, 0, 0, 2
from players p where p.name='Kofi Baah';

-- Konkoni (DEF, BEC): 90 min, no CS → 2 pts
insert into player_gameweek_stats
  (player_id, gameweek_id, fixture_id, minutes, goals, assists, clean_sheet, saves, penalty_saves, yellow_cards, red_cards, own_goals, bonus, calculated_points)
select p.id,
  (select id from gameweeks where number=1 and season_id=(select id from seasons where is_active=true)),
  (select f.id from fixtures f join real_teams ht on f.home_team_id=ht.id join real_teams at on f.away_team_id=at.id where ht.short_name='ADU' and at.short_name='BEC' and f.gameweek_id=(select id from gameweeks where number=1 and season_id=(select id from seasons where is_active=true))),
  90, 0, 0, false, 0, 0, 0, 0, 0, 0, 2
from players p where p.name='Hafiz Konkoni';

-- Rocha (MID, BEC): 90 min, no CS → 2 pts
insert into player_gameweek_stats
  (player_id, gameweek_id, fixture_id, minutes, goals, assists, clean_sheet, saves, penalty_saves, yellow_cards, red_cards, own_goals, bonus, calculated_points)
select p.id,
  (select id from gameweeks where number=1 and season_id=(select id from seasons where is_active=true)),
  (select f.id from fixtures f join real_teams ht on f.home_team_id=ht.id join real_teams at on f.away_team_id=at.id where ht.short_name='ADU' and at.short_name='BEC' and f.gameweek_id=(select id from gameweeks where number=1 and season_id=(select id from seasons where is_active=true))),
  90, 0, 0, false, 0, 0, 0, 0, 0, 0, 2
from players p where p.name='Samuel Rocha';

-- Agbesimah (MID, BEC): 90 min, 1 assist (set up Tweneboah goal) → 2+3 = 5 pts
insert into player_gameweek_stats
  (player_id, gameweek_id, fixture_id, minutes, goals, assists, clean_sheet, saves, penalty_saves, yellow_cards, red_cards, own_goals, bonus, calculated_points)
select p.id,
  (select id from gameweeks where number=1 and season_id=(select id from seasons where is_active=true)),
  (select f.id from fixtures f join real_teams ht on f.home_team_id=ht.id join real_teams at on f.away_team_id=at.id where ht.short_name='ADU' and at.short_name='BEC' and f.gameweek_id=(select id from gameweeks where number=1 and season_id=(select id from seasons where is_active=true))),
  90, 0, 1, false, 0, 0, 0, 0, 0, 0, 5
from players p where p.name='Kofi Agbesimah';

-- Tweneboah (FWD, BEC): 90 min, 1 goal, 1 bonus → 2+4+1 = 7 pts
insert into player_gameweek_stats
  (player_id, gameweek_id, fixture_id, minutes, goals, assists, clean_sheet, saves, penalty_saves, yellow_cards, red_cards, own_goals, bonus, calculated_points)
select p.id,
  (select id from gameweeks where number=1 and season_id=(select id from seasons where is_active=true)),
  (select f.id from fixtures f join real_teams ht on f.home_team_id=ht.id join real_teams at on f.away_team_id=at.id where ht.short_name='ADU' and at.short_name='BEC' and f.gameweek_id=(select id from gameweeks where number=1 and season_id=(select id from seasons where is_active=true))),
  90, 1, 0, false, 0, 0, 0, 0, 0, 1, 7
from players p where p.name='Benjamin Tweneboah';


-- ============================================================
-- STEP 7: Update player total_points from GW1 stats
-- ============================================================

update players p
set total_points = s.calculated_points
from player_gameweek_stats s
where s.player_id = p.id;


-- ============================================================
-- STEP 8: Demo fantasy team + GW1 picks with points
-- ============================================================
-- Instructions:
--   1. Register/sign in at your app URL
--   2. Go to Supabase → Authentication → Users
--   3. Copy your user UUID
--   4. Replace 'YOUR-USER-UUID-HERE' below with that UUID
--   5. Uncomment the entire block and run it
-- ============================================================

-- Squad (4-4-2, total cost ₵99.5m):
--   GK:  Attah (HOA ₵4.5), Adams (DRM ₵4.5) [bench]
--   DEF: Amankwah (HOA ₵5.0), Ganiu (KOT ₵5.5), Blay (MED ₵5.0), Baffour (DRM ₵5.0) | Asubonteng [bench]
--   MID: Yiadom (HOA ₵6.0), Mudasiru (KOT ₵7.0), Donsu (MED ₵6.5), Issahaku (ADU ₵7.5) | Gyamfi [bench]
--   FWD: Afriyie (HOA ₵7.5), Mbella (KOT ₵8.0) | Enchil [bench]
--
-- GW1 points (captain = Afriyie 2x):
--   Attah 3 + Amankwah 2 + Ganiu 2 + Blay 6 + Baffour 6
--   + Yiadom 5 + Mudasiru 6 + Donsu 3 + Issahaku 15
--   + Afriyie 12×2(captain) + Mbella 9
--   = 3+2+2+6+6+5+6+3+15+24+9 = 81 pts

/*
do $$
declare
  v_user_id uuid := 'YOUR-USER-UUID-HERE';
  v_season_id uuid;
  v_team_id uuid;
  v_gw1_id uuid;
  v_gw2_id uuid;
begin
  select id into v_season_id from seasons where is_active = true;
  select id into v_gw1_id from gameweeks where number = 1 and season_id = v_season_id;
  select id into v_gw2_id from gameweeks where number = 2 and season_id = v_season_id;

  -- Create fantasy team
  insert into fantasy_teams (user_id, season_id, name, total_points, free_transfers, bank)
  values (v_user_id, v_season_id, 'Demo All Stars', 81, 1, 0.5)
  returning id into v_team_id;

  -- GW1 picks (is_starting = true for 11, false for 4 bench)
  -- Starting XI
  insert into fantasy_picks (fantasy_team_id, gameweek_id, player_id, is_starting, is_captain, is_vice_captain, points_scored)
  select v_team_id, v_gw1_id, p.id,
    true,
    p.name = 'Daniel Afriyie',        -- captain
    p.name = 'Fatawu Issahaku',       -- vice captain
    s.calculated_points * case when p.name = 'Daniel Afriyie' then 2 else 1 end
  from players p
  join player_gameweek_stats s on s.player_id = p.id and s.gameweek_id = v_gw1_id
  where p.name in (
    'Richard Attah', 'Caleb Amankwah', 'Ismail Ganiu', 'Justice Blay', 'Philemon Baffour',
    'Konadu Yiadom', 'Mudasiru Salifu', 'Kwasi Donsu', 'Fatawu Issahaku',
    'Daniel Afriyie', 'Frank Mbella'
  );

  -- Bench (bench_order 1-4)
  insert into fantasy_picks (fantasy_team_id, gameweek_id, player_id, is_starting, bench_order, is_captain, is_vice_captain, points_scored)
  values
    (v_team_id, v_gw1_id, (select id from players where name='Stephen Adams'),      false, 1, false, false, 6),
    (v_team_id, v_gw1_id, (select id from players where name='Enoch Asubonteng'),   false, 2, false, false, 2),
    (v_team_id, v_gw1_id, (select id from players where name='Emmanuel Gyamfi'),    false, 3, false, false, 9),
    (v_team_id, v_gw1_id, (select id from players where name='Bright Enchil'),      false, 4, false, false, 8);

  -- GW2 picks — same squad, carried forward (0 points as GW2 not played)
  insert into fantasy_picks (fantasy_team_id, gameweek_id, player_id, is_starting, is_captain, is_vice_captain, points_scored)
  select v_team_id, v_gw2_id, p.id,
    true,
    p.name = 'Daniel Afriyie',
    p.name = 'Fatawu Issahaku',
    0
  from players p
  where p.name in (
    'Richard Attah', 'Caleb Amankwah', 'Ismail Ganiu', 'Justice Blay', 'Philemon Baffour',
    'Konadu Yiadom', 'Mudasiru Salifu', 'Kwasi Donsu', 'Fatawu Issahaku',
    'Daniel Afriyie', 'Frank Mbella'
  );

  insert into fantasy_picks (fantasy_team_id, gameweek_id, player_id, is_starting, bench_order, is_captain, is_vice_captain, points_scored)
  values
    (v_team_id, v_gw2_id, (select id from players where name='Stephen Adams'),      false, 1, false, false, 0),
    (v_team_id, v_gw2_id, (select id from players where name='Enoch Asubonteng'),   false, 2, false, false, 0),
    (v_team_id, v_gw2_id, (select id from players where name='Emmanuel Gyamfi'),    false, 3, false, false, 0),
    (v_team_id, v_gw2_id, (select id from players where name='Bright Enchil'),      false, 4, false, false, 0);

  -- Demo league
  insert into leagues (name, type, code, created_by, season_id)
  values ('Demo League', 'classic', 'DEMO01', v_user_id, v_season_id);

  insert into league_members (league_id, fantasy_team_id)
  select l.id, v_team_id from leagues l where l.code = 'DEMO01';

  raise notice 'Demo team created! Team ID: %', v_team_id;
end $$;
*/
