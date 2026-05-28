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
