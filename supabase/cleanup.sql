-- ============================================================
-- CLEANUP SCRIPT — wipes all mock/demo data
-- Run in the Supabase SQL editor.
--
-- Deletes (in FK-safe order): all gameplay data, leagues,
-- fixtures, gameweeks, players and clubs.
-- Keeps: auth users, admin_users, seasons, fantasy_teams
-- (fantasy teams are reset to zero so existing accounts keep
-- working — they just need to pick a new squad).
-- ============================================================

-- 1. Gameplay data
delete from player_gameweek_stats;
delete from fantasy_picks;
delete from transfers;
delete from chips_used;

-- 2. Leagues
delete from h2h_matches;
delete from league_members;
delete from leagues;

-- 3. Schedule
delete from fixtures;
delete from gameweeks;

-- 4. Players & clubs (the mock seed data)
delete from players;
delete from real_teams;

-- 5. Reset fantasy teams so existing accounts start fresh
--    (bank 0 = full ₵100.0m budget; free_transfers 0 = unlimited
--     until the first deadline)
update fantasy_teams
set total_points  = 0,
    overall_rank  = null,
    bank          = 0,
    free_transfers = 0;

-- ============================================================
-- OPTIONAL — uncomment to also delete fantasy teams entirely.
-- Note: users would need to register again to get a team,
-- since teams are only created at registration.
-- ============================================================
-- delete from fantasy_teams;

-- ============================================================
-- After cleanup, enter real data via the admin panel:
--   /admin/teams      → add the clubs (name, short name, colour)
--   /admin/players    → add players (position, price, availability)
--   /admin/gameweeks  → create GW1, set deadline, mark it current
--   /admin/fixtures   → schedule the matches
--   /admin/matches    → after each match: score, line-ups, events
--   /admin/gameweeks  → "Finalize & Score" once all results are in
-- ============================================================
