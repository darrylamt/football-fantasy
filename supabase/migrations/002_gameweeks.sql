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
