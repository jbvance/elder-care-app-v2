-- Only narrow RPCs can access these records. Ownership alone grants no sharing.
create table private.prompting_scopes (
 id uuid primary key references public.private_arrangements(id), summary jsonb not null,
 permission_kind text not null check(permission_kind in ('direct','reported')),
 permission_author uuid not null references auth.users(id), permission_source text not null,
 recorded_at timestamptz not null default clock_timestamp(),
 delegation text not null default 'invite-and-remove-for-this-need',
 shareable boolean not null default true, authority_active boolean not null default true
);
create table private.invitations (
 id uuid primary key default gen_random_uuid(), scope_id uuid not null references private.prompting_scopes(id),
 inviter uuid not null references auth.users(id), recipient text not null, operation uuid not null,
 token_hash text not null unique, issued_at timestamptz not null default clock_timestamp(),
 expires_at timestamptz not null default (clock_timestamp()+interval '7 days'),
 state text not null default 'pending' check(state in ('pending','revoked','replaced','joined')),
 joined_by uuid references auth.users(id), joined_at timestamptz, unique(inviter,operation)
);
create table private.prompting_participants (
 scope_id uuid not null references private.prompting_scopes(id), user_id uuid not null references auth.users(id),
 invitation_id uuid not null references private.invitations(id), joined_at timestamptz not null default clock_timestamp(),
 removed_at timestamptz, primary key(scope_id,user_id)
);
revoke all on all tables in schema private from public,anon,authenticated;

create function private.prepare_invitation_scope(p_scope uuid,p_kind text,p_source text,p_delegation boolean)
returns jsonb language plpgsql security definer set search_path='' as $$
declare d jsonb; s private.prompting_scopes;
begin
 perform public.check_private_session();
 select draft into d from public.private_arrangements where id=p_scope and owner_id=auth.uid() for update;
 if d is null or p_kind is null or p_kind not in ('direct','reported') or coalesce(btrim(p_source),'')='' or length(p_source)>254 or p_delegation is distinct from true then
 raise sqlstate 'PT403' using message='Record applicable permission and delegation first.'; end if;
 if p_kind='direct' then p_source:='Signed-in older adult, own statement'; end if;
 insert into private.prompting_scopes(id,summary,permission_kind,permission_author,permission_source)
 values(p_scope,jsonb_build_object('olderAdult',d->>'olderAdult','description',d->>'description','location',d->>'location','date',d->>'date','time',d->>'time','timeZone',d->>'timeZone'),p_kind,auth.uid(),btrim(p_source)) on conflict(id) do nothing;
 select * into s from private.prompting_scopes where id=p_scope;
 if s.permission_kind<>p_kind or s.permission_source<>btrim(p_source) then raise sqlstate 'PT409' using message='Permission already recorded. Reopen it.'; end if;
 return jsonb_build_object('id',s.id,'summary',s.summary);
end $$;

create function private.issue_invitation(p_scope uuid,p_recipient text,p_operation uuid,p_token text)
returns uuid language plpgsql security definer set search_path='' as $$
declare s private.prompting_scopes; i private.invitations;
begin
 perform public.check_private_session();
 select * into s from private.prompting_scopes where id=p_scope for update;
 if s.id is null or s.permission_author<>auth.uid() or not s.shareable or not s.authority_active then raise sqlstate 'PT403' using message='Current sharing authority is required.'; end if;
 p_recipient:=lower(btrim(p_recipient));
 if p_recipient is null or p_recipient !~ '^[^[:space:]@]+@example[.]test$' or length(p_recipient)>254 or p_token is null or p_token !~ '^[a-f0-9]{64}$' or p_operation is null then raise sqlstate 'PT400' using message='Use a fictional recipient and valid operation.'; end if;
 select * into i from private.invitations where inviter=auth.uid() and operation=p_operation;
 if found then
 if i.scope_id<>p_scope or i.recipient<>p_recipient or i.token_hash<>encode(extensions.digest(p_token,'sha256'),'hex') then raise sqlstate 'PT409' using message='Operation already used.'; end if;
 return i.id; end if;
 update private.invitations set state='replaced' where scope_id=p_scope and recipient=p_recipient and state='pending';
 insert into private.invitations(scope_id,inviter,recipient,operation,token_hash) values(p_scope,auth.uid(),p_recipient,p_operation,encode(extensions.digest(p_token,'sha256'),'hex')) returning id into i.id;
 return i.id;
end $$;

create function private.read_prompting_summary(p_scope uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare s private.prompting_scopes;
begin
 perform public.check_private_session();
 select * into s from private.prompting_scopes where id=p_scope for share;
 if s.id is null or not s.shareable or not (s.permission_author=auth.uid() or exists(select 1 from private.prompting_participants where scope_id=p_scope and user_id=auth.uid() and removed_at is null)) then raise sqlstate 'PT403' using message='This request is unavailable.'; end if;
 return jsonb_build_object('id',s.id,'summary',s.summary,'inviter',s.permission_author,'recorded_at',s.recorded_at);
end $$;

create function private.join_invitation(p_token text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare i private.invitations; s private.prompting_scopes; email text; confirmed timestamptz; removed timestamptz;
begin
 perform public.check_private_session();
 select * into i from private.invitations where token_hash=encode(extensions.digest(p_token,'sha256'),'hex');
 if not found then raise sqlstate 'PT403' using message='This invitation is unavailable. Sign in with the intended address or ask for a new invitation.'; end if;
 select * into s from private.prompting_scopes where id=i.scope_id for update;
 select * into i from private.invitations where id=i.id for update;
 select lower(btrim(u.email)),u.email_confirmed_at into email,confirmed from auth.users u where u.id=auth.uid() for share;
 select removed_at into removed from private.prompting_participants where scope_id=s.id and user_id=auth.uid();
 if confirmed is null or email is distinct from i.recipient or not s.shareable or removed is not null then raise sqlstate 'PT403' using message='This invitation is unavailable. Sign in with the intended address or ask for a new invitation.'; end if;
 if i.state='joined' then
 if i.joined_by<>auth.uid() or not exists(select 1 from private.prompting_participants where scope_id=s.id and user_id=auth.uid() and removed_at is null) then raise sqlstate 'PT403' using message='This invitation is unavailable.'; end if;
 return private.read_prompting_summary(s.id); end if;
 if i.state<>'pending' or clock_timestamp()>=i.expires_at or not s.authority_active or i.inviter<>s.permission_author then raise sqlstate 'PT403' using message='This invitation is unavailable. Ask for a new invitation.'; end if;
 insert into private.prompting_participants(scope_id,user_id,invitation_id) values(s.id,auth.uid(),i.id) on conflict(scope_id,user_id) do nothing;
 update private.invitations set state='joined',joined_by=auth.uid(),joined_at=clock_timestamp() where id=i.id;
 return private.read_prompting_summary(s.id);
end $$;

create function private.manage_invitation_scope(p_scope uuid,p_action text,p_target uuid default null) returns boolean
language plpgsql security definer set search_path='' as $$
declare s private.prompting_scopes;
begin
 perform public.check_private_session();
 select * into s from private.prompting_scopes where id=p_scope for update;
 if s.id is null or s.permission_author<>auth.uid() or not s.authority_active or not s.shareable then raise sqlstate 'PT403' using message='Current participation-management authority is required.'; end if;
 if p_action='remove' then
 update private.prompting_participants set removed_at=coalesce(removed_at,clock_timestamp()) where scope_id=p_scope and user_id=p_target;
 elsif p_action='revoke' then
 update private.invitations set state='revoked' where scope_id=p_scope and id=p_target and state='pending';
 elsif p_action in ('withdraw','end-authority') then
 update private.prompting_scopes set shareable=case when p_action='withdraw' then false else shareable end,authority_active=false where id=p_scope;
 update private.invitations set state='revoked' where scope_id=p_scope and state='pending';
 else raise sqlstate 'PT400' using message='Unknown action.'; end if;
 return true;
end $$;

create function private.list_invitation_scope(p_scope uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare s private.prompting_scopes;
begin
 perform public.check_private_session();
 select * into s from private.prompting_scopes where id=p_scope and permission_author=auth.uid() for share;
 if s.id is null then return null; end if;
 return jsonb_build_object('id',s.id,'summary',s.summary,'permission_kind',s.permission_kind,'permission_source',s.permission_source,'recorded_at',s.recorded_at,'authority_active',s.authority_active,'shareable',s.shareable,
 'invitations',coalesce((select jsonb_agg(jsonb_build_object('id',id,'recipient',recipient,'state',state,'expires_at',expires_at)) from private.invitations where scope_id=p_scope),'[]'::jsonb),
 'participants',coalesce((select jsonb_agg(jsonb_build_object('user_id',user_id,'removed',removed_at is not null)) from private.prompting_participants where scope_id=p_scope),'[]'::jsonb));
end $$;

revoke all on function private.read_prompting_summary(uuid) from public,anon,authenticated;
grant execute on function private.read_prompting_summary(uuid) to authenticated;
create function public.read_prompting_summary(p_scope uuid) returns jsonb language sql security invoker set search_path='' as $$ select private.read_prompting_summary(p_scope); $$;
revoke all on function public.read_prompting_summary(uuid) from public,anon;
grant execute on function public.read_prompting_summary(uuid) to authenticated;

revoke all on function private.join_invitation(text) from public,anon,authenticated;
grant execute on function private.join_invitation(text) to authenticated;
create function public.join_invitation(p_token text) returns jsonb language sql security invoker set search_path='' as $$ select private.join_invitation(p_token); $$;
revoke all on function public.join_invitation(text) from public,anon;
grant execute on function public.join_invitation(text) to authenticated;

revoke all on function private.manage_invitation_scope(uuid,text,uuid) from public,anon,authenticated;
grant execute on function private.manage_invitation_scope(uuid,text,uuid) to authenticated;
create function public.manage_invitation_scope(p_scope uuid,p_action text,p_target uuid default null) returns boolean language sql security invoker set search_path='' as $$ select private.manage_invitation_scope(p_scope,p_action,p_target); $$;
revoke all on function public.manage_invitation_scope(uuid,text,uuid) from public,anon;
grant execute on function public.manage_invitation_scope(uuid,text,uuid) to authenticated;

revoke all on function private.list_invitation_scope(uuid) from public,anon,authenticated;
grant execute on function private.list_invitation_scope(uuid) to authenticated;
create function public.list_invitation_scope(p_scope uuid) returns jsonb language sql security invoker set search_path='' as $$ select private.list_invitation_scope(p_scope); $$;
revoke all on function public.list_invitation_scope(uuid) from public,anon;
grant execute on function public.list_invitation_scope(uuid) to authenticated;
notify pgrst, 'reload schema';
