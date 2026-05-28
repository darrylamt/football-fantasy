-- Must be created first as other policies reference it
create table admin_users (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade unique,
  created_at timestamptz default now()
);

alter table admin_users enable row level security;

create policy "Admin read admin_users" on admin_users for select using (
  auth.uid() = user_id
);
