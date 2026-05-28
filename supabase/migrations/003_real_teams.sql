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
