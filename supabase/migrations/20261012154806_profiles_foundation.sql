-- M-002 / TASK-006: safe, deny-by-default account profile foundation.
-- Admin provisioning belongs to trusted scripts / Edge Functions, not client grants.
create type public.app_role as enum ('admin', 'teacher', 'student');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique
    check (username ~ '^[a-z0-9_]{3,32}$' and username = lower(btrim(username))),
  display_name text not null
    check (char_length(btrim(display_name)) between 1 and 80 and display_name = btrim(display_name)),
  role public.app_role not null,
  active boolean not null default true,
  must_change_password boolean not null default true,
  created_at timestamptz not null default now()
);

comment on table public.profiles is 'Trusted provisioning only; user roles/flags cannot be edited via client API.';

alter table public.profiles enable row level security;

-- A user may read only their own ready/active profile.
-- Pending password changes and inactive users receive no profile data via Data API.
create policy profiles_select_self_ready_v1 on public.profiles
  for select to authenticated
  using (
    id = (select auth.uid())
    and active is true
    and must_change_password is false
  );

-- No INSERT/UPDATE/DELETE policies for browser clients.
revoke all on table public.profiles from public, anon, authenticated;
grant select on table public.profiles to authenticated;
grant all on table public.profiles to service_role;
grant usage on type public.app_role to authenticated, service_role;

-- Future protected-data RPCs should call this helper, not trust JWT user_metadata.
-- A SECURITY DEFINER never lives in a PostgREST exposed schema.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create function private.profile_ready_v1()
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid())
      and p.active is true
      and p.must_change_password is false
  );
$function$;

revoke execute on function private.profile_ready_v1() from public, anon;
grant usage on schema private to authenticated;
grant execute on function private.profile_ready_v1() to authenticated;
