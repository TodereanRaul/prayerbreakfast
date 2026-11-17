-- is_admin() only needs to see the caller's own row in public.admins, which the
-- "Admins can see their own row" policy already allows, so it does not need to
-- run with the owner's rights.
create or replace function public.is_admin()
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select exists (
    select 1 from public.admins where user_id = (select auth.uid())
  );
$$;

-- Anonymous visitors evaluate is_admin() inside the events policy: they need
-- to be allowed to query the table (row-level security still returns no rows).
grant select on public.admins to anon, authenticated;
