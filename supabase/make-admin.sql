-- ============================================================
-- GRANT ADMIN ACCESS
-- Run in the Supabase SQL editor.
--
-- The /admin section is protected by the admin_users table:
-- the middleware redirects anyone without a row here back to
-- the homepage. This grants admin to your account by email —
-- no need to look up the auth UUID manually.
--
-- The account must already exist (register on the site first).
-- ============================================================

insert into admin_users (user_id)
select id from auth.users
where email in ('amoateydarryl4@gmail.com', 'damoatey@icloud.com')
on conflict (user_id) do nothing;

-- Verify it worked (should return one row):
select au.user_id, u.email
from admin_users au
join auth.users u on u.id = au.user_id;
