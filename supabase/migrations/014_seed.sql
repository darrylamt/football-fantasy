-- ============================================================
-- SEED DATA — run after all schema migrations
-- Replace 'YOUR_EMAIL_HERE' with your actual email before running
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
select
  s.id,
  1,
  now() + interval '7 days',
  'active',
  true
from seasons s where s.is_active = true;

insert into gameweeks (season_id, number, deadline, status, is_current)
select
  s.id,
  2,
  now() + interval '14 days',
  'upcoming',
  false
from seasons s where s.is_active = true;

-- Players (30 players across positions and teams)
insert into players (name, display_name, position, team_id, price, status)
select
  p.name, p.display_name, p.position, t.id, p.price, 'available'
from (values
  -- Hearts of Oak
  ('Richard Attah', 'Attah', 'GK', 'Hearts of Oak', 4.5),
  ('Caleb Amankwah', 'Amankwah', 'DEF', 'Hearts of Oak', 5.0),
  ('Mohammed Alhassan', 'Alhassan', 'DEF', 'Hearts of Oak', 4.5),
  ('Konadu Yiadom', 'Yiadom', 'MID', 'Hearts of Oak', 6.0),
  ('Daniel Afriyie', 'Afriyie', 'FWD', 'Hearts of Oak', 7.5),
  -- Asante Kotoko
  ('Danlad Ibrahim', 'Danlad', 'GK', 'Asante Kotoko', 5.0),
  ('Ismail Ganiu', 'Ganiu', 'DEF', 'Asante Kotoko', 5.5),
  ('Enoch Asubonteng', 'Asubonteng', 'DEF', 'Asante Kotoko', 4.5),
  ('Mudasiru Salifu', 'Mudasiru', 'MID', 'Asante Kotoko', 7.0),
  ('Frank Mbella', 'Mbella', 'FWD', 'Asante Kotoko', 8.0),
  -- Medeama SC
  ('Eric Ofori Antwi', 'Antwi', 'GK', 'Medeama SC', 4.0),
  ('Justice Blay', 'Blay', 'DEF', 'Medeama SC', 5.0),
  ('Kwasi Donsu', 'Donsu', 'MID', 'Medeama SC', 6.5),
  ('Amos Leahy', 'Leahy', 'MID', 'Medeama SC', 5.5),
  ('Prince Opoku Agyemang', 'P. Agyemang', 'FWD', 'Medeama SC', 7.0),
  -- Aduana Stars
  ('Danlad Ayuba', 'Ayuba', 'GK', 'Aduana Stars', 4.0),
  ('Bright Adjei', 'B. Adjei', 'DEF', 'Aduana Stars', 4.5),
  ('Fatawu Issahaku', 'Issahaku', 'MID', 'Aduana Stars', 7.5),
  ('Emmanuel Gyamfi', 'Gyamfi', 'MID', 'Aduana Stars', 6.0),
  ('Bright Enchil', 'Enchil', 'FWD', 'Aduana Stars', 6.5),
  -- Dreams FC
  ('Stephen Adams', 'Adams', 'GK', 'Dreams FC', 4.5),
  ('Philemon Baffour', 'Baffour', 'DEF', 'Dreams FC', 5.0),
  ('Sampson Agyapong', 'Agyapong', 'DEF', 'Dreams FC', 4.5),
  ('John Antwi', 'J. Antwi', 'MID', 'Dreams FC', 5.5),
  ('Sadiq Ibrahim', 'Sadiq', 'FWD', 'Dreams FC', 6.5),
  -- Bechem United
  ('Kofi Baah', 'K. Baah', 'GK', 'Bechem United', 4.0),
  ('Hafiz Konkoni', 'Konkoni', 'DEF', 'Bechem United', 5.0),
  ('Samuel Rocha', 'Rocha', 'MID', 'Bechem United', 6.0),
  ('Kofi Agbesimah', 'Agbesimah', 'MID', 'Bechem United', 5.5),
  ('Benjamin Tweneboah', 'Tweneboah', 'FWD', 'Bechem United', 7.0)
) as p(name, display_name, position, team_name, price)
join real_teams t on t.name = p.team_name;

-- Admin user — insert AFTER creating the user in Supabase Auth dashboard
-- Replace the UUID below with the user's actual UUID from auth.users
-- insert into admin_users (user_id) values ('YOUR-USER-UUID-HERE');
