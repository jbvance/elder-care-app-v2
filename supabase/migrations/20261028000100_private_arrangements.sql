-- Ticket 02: private owner only. No membership, invitation or collaboration rights.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

-- PostgREST validates JWT signature/expiry. Also check the live Supabase session:
-- logout removes it; not_after records an explicit Auth expiry when present.
-- Inactivity remains Auth's refresh-based policy, not a custom activity timer.
create function private.current_session_valid() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from auth.sessions s
    where s.id::text = auth.jwt()->>'session_id'
      and s.user_id = auth.uid()
      and (s.not_after is null or s.not_after > now())
  );
$$;
revoke all on function private.current_session_valid() from public;
grant usage on schema private to authenticated;
grant execute on function private.current_session_valid() to authenticated;

create table public.private_arrangements (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id),
  operation_id uuid not null,
  draft jsonb not null check (jsonb_typeof(draft) = 'object'),
  created_at timestamptz not null default now(),
  unique(owner_id, operation_id)
);
alter table public.private_arrangements enable row level security;
revoke all on public.private_arrangements from anon, authenticated;
grant select on public.private_arrangements to authenticated;
create policy private_owner_read on public.private_arrangements for select
to authenticated using (owner_id = (select auth.uid()) and (select private.current_session_valid()));

notify pgrst, 'reload schema';
