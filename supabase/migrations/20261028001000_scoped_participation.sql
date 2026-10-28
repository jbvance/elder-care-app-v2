-- Ticket 04: fixed, scoped capabilities; no responsibility execution endpoints.
alter table private.prompting_scopes add column arrangement_id uuid references public.private_arrangements(id);
update private.prompting_scopes set arrangement_id=id;
alter table private.prompting_scopes alter column arrangement_id set not null;
alter table private.prompting_scopes drop constraint prompting_scopes_id_fkey;
alter table private.prompting_scopes add column revision bigint not null default 0;
create table private.coordination_authorizations (
 arrangement_id uuid primary key references public.private_arrangements(id),
 author uuid not null references auth.users(id), kind text not null check(kind in ('direct','reported')),
 source text not null, ceiling jsonb not null, recorded_at timestamptz not null default clock_timestamp()
);
create table private.scope_involvement (
 scope_id uuid not null references private.prompting_scopes(id), user_id uuid not null references auth.users(id),
 label text not null, rights jsonb not null, blocked boolean not null default false,
 primary key(scope_id,user_id)
);
create table private.scope_background (
 scope_id uuid primary key references private.prompting_scopes(id), content text not null default ''
);
create table private.participation_history (
 id bigint generated always as identity primary key, scope_id uuid not null references private.prompting_scopes(id),
 actor uuid not null references auth.users(id), operation uuid not null, action text not null,
 input jsonb not null, before_state jsonb, after_state jsonb,
 recorded_at timestamptz not null default clock_timestamp(), unique(actor,operation)
);
create table private.helper_suggestions (
 id uuid primary key default gen_random_uuid(), scope_id uuid not null references private.prompting_scopes(id),
 author uuid not null references auth.users(id), address text not null, recorded_at timestamptz not null default clock_timestamp()
);
revoke all on all tables in schema private from public,anon,authenticated;

create function private.helper_rights() returns jsonb language sql immutable set search_path='' as $$
 select '{"preset":"helper","practical":true,"manage":false,"delegate":false,"background":false,"share_background":false,"disclose":false,"cancel":false,"resolve":false,"external":false}'::jsonb;
$$;
create function private.valid_involvement(r jsonb) returns boolean language plpgsql immutable set search_path='' as $$
declare k text;
begin
 if r is null or jsonb_typeof(r)<>'object' then return false; end if;
 if (select count(*) from jsonb_object_keys(r))<>10 or r->>'preset' not in ('helper','coordinator') or r->>'preset' is null then return false; end if;
 foreach k in array array['practical','manage','delegate','background','share_background','disclose','cancel','resolve','external'] loop
  if jsonb_typeof(r->k) is distinct from 'boolean' then return false; end if;
 end loop;
 return (r->>'preset'<>'coordinator' or r->'resolve'='true') and (r->'delegate'='false' or r->'manage'='true') and (r->'share_background'='false' or r->'background'='true');
end $$;
create function private.involvement(p_scope uuid,p_user uuid) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare s private.prompting_scopes; m private.scope_involvement; r jsonb;
begin
 select * into s from private.prompting_scopes where id=p_scope;
 if s.id is null or not s.shareable or exists(select 1 from private.prompting_participants where scope_id=p_scope and user_id=p_user and removed_at is not null) then return null; end if;
 select * into m from private.scope_involvement where scope_id=p_scope and user_id=p_user;
 if found then if m.blocked then return null; end if; r:=m.rights;
 elsif p_user=s.permission_author then r:=private.helper_rights() || jsonb_build_object('manage',s.authority_active);
 elsif exists(select 1 from private.prompting_participants where scope_id=p_scope and user_id=p_user and removed_at is null) then r:=private.helper_rights();
 else return null; end if;
 if p_user=s.permission_author and not s.authority_active then r:=r||'{"manage":false,"delegate":false}'::jsonb; end if;
 return r;
end $$;

create function private.read_scope_context(p_scope uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare s private.prompting_scopes; r jsonb; result jsonb;
begin
 select * into s from private.prompting_scopes where id=p_scope for share;
 perform public.check_private_session(); r:=private.involvement(p_scope,auth.uid());
 if r is null then raise sqlstate 'PT403' using message='This scope is unavailable.'; end if;
 result:=jsonb_build_object('id',s.id,'arrangement_id',s.arrangement_id,'revision',s.revision,'rights',r);
 if r->'practical'='true' then result:=result||jsonb_build_object('summary',s.summary,'inviter',s.inviter_label,'recorded_at',s.recorded_at); end if;
 if r->'background'='true' then result:=result||jsonb_build_object('background',coalesce((select content from private.scope_background where scope_id=s.id),'')); end if;
 if r->'manage'='true' then
 result:=result||jsonb_build_object('permission_kind',s.permission_kind,'permission_source',s.permission_source,
 'participants',coalesce((select jsonb_agg(x) from (
 select p.user_id,i.recipient as label,private.involvement(s.id,p.user_id) as rights,p.removed_at is not null as removed
 from private.prompting_participants p join private.invitations i on i.id=p.invitation_id where p.scope_id=s.id
 union all select m.user_id,m.label,private.involvement(s.id,m.user_id),m.blocked from private.scope_involvement m
 where m.scope_id=s.id and not exists(select 1 from private.prompting_participants p where p.scope_id=s.id and p.user_id=m.user_id)
 ) x),'[]'::jsonb),
 'suggestions',coalesce((select jsonb_agg(jsonb_build_object('address',address,'author',author)) from private.helper_suggestions where scope_id=s.id),'[]'::jsonb));
 end if;
 return result;
end $$;

create function private.start_coordination(p_arrangement uuid,p_kind text,p_source text,p_rights jsonb,p_operation uuid) returns uuid
language plpgsql security definer set search_path='' as $$
declare d jsonb; a private.coordination_authorizations;
begin
 perform 1 from public.private_arrangements where id=p_arrangement and owner_id=auth.uid() for update;
 if not found then raise sqlstate 'PT403' using message='A private preparation and applicable permission are required.'; end if;
 perform public.check_private_session();
 if p_operation is null or not private.valid_involvement(p_rights) or p_rights->>'preset'<>'coordinator' or p_rights->'manage'<>'true' or p_rights->'practical'<>'true' or p_kind is null or p_kind not in ('direct','reported') or coalesce(btrim(p_source),'')='' or length(p_source)>254 then raise sqlstate 'PT400' using message='Record the applicable coordination permission.'; end if;
 if p_kind='direct' then p_source:='Signed-in older adult, own statement'; end if;
 select * into a from private.coordination_authorizations where arrangement_id=p_arrangement;
 if found then
 if a.author<>auth.uid() or a.ceiling<>p_rights or a.kind<>p_kind or a.source<>btrim(p_source) or not exists(select 1 from private.participation_history where actor=auth.uid() and operation=p_operation and scope_id=p_arrangement and action='initial') then raise sqlstate 'PT409' using message='Authorization already recorded; it cannot be expanded by repeating setup.'; end if;
 return p_arrangement; end if;
 if exists(select 1 from private.prompting_scopes where arrangement_id=p_arrangement) then raise sqlstate 'PT403' using message='Existing narrow authorization cannot be expanded by recording another statement.'; end if;
 if exists(select 1 from private.participation_history where actor=auth.uid() and operation=p_operation) then raise sqlstate 'PT409' using message='Operation already used.'; end if;
 select draft into d from public.private_arrangements where id=p_arrangement;
 insert into private.coordination_authorizations values(p_arrangement,auth.uid(),p_kind,btrim(p_source),p_rights,clock_timestamp());
 insert into private.prompting_scopes(id,arrangement_id,summary,permission_kind,permission_author,permission_source,inviter_label)
 values(p_arrangement,p_arrangement,jsonb_build_object('olderAdult',d->>'olderAdult','description',d->>'description','location',d->>'location','date',d->>'date','time',d->>'time','timeZone',d->>'timeZone'),p_kind,auth.uid(),btrim(p_source),(select email from auth.users where id=auth.uid()));
 insert into private.scope_involvement(scope_id,user_id,label,rights) values(p_arrangement,auth.uid(),(select email from auth.users where id=auth.uid()),p_rights);
 insert into private.participation_history(scope_id,actor,operation,action,input,after_state) values(p_arrangement,auth.uid(),p_operation,'initial',p_rights,p_rights);
 return p_arrangement;
end $$;

create function private.change_involvement(p_scope uuid,p_user uuid,p_rights jsonb,p_remove boolean,p_kind text,p_source text,p_revision bigint,p_operation uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare s private.prompting_scopes; actor_rights jsonb; previous jsonb; k text; h private.participation_history; args jsonb; label text;
begin
 select * into s from private.prompting_scopes where id=p_scope for update;
 perform public.check_private_session(); actor_rights:=private.involvement(p_scope,auth.uid()); previous:=private.involvement(p_scope,p_user);
 if actor_rights is null or actor_rights->'manage'<>'true' then raise sqlstate 'PT403' using message='Current scoped management delegation is required.'; end if;
 args:=jsonb_build_object('user',p_user,'rights',p_rights,'remove',p_remove,'kind',p_kind,'source',p_source,'revision',p_revision);
 select * into h from private.participation_history where actor=auth.uid() and operation=p_operation;
 if found then if h.scope_id<>p_scope or h.action<>'involvement' or h.input<>args then raise sqlstate 'PT409' using message='Operation already used with different contents.'; end if; return private.read_scope_context(p_scope); end if;
 if p_remove is null or p_operation is null or p_kind is null or p_kind not in ('direct','reported') or coalesce(btrim(p_source),'')='' or length(p_source)>254 or not private.valid_involvement(p_rights) then raise sqlstate 'PT400' using message='Record the applicable permission and valid involvement.'; end if;
 if s.revision is distinct from p_revision then raise sqlstate 'PT409' using message='Involvement changed. Reopen it before trying again.'; end if;
 if previous is null then raise sqlstate 'PT403' using message='This participant is not currently eligible in this scope.'; end if;
 if not p_remove then
 if p_rights->>'preset'='coordinator' and previous->>'preset'<>'coordinator' and actor_rights->>'preset'<>'coordinator' then raise sqlstate 'PT403' using message='Coordination authority is required.'; end if;
 foreach k in array array['practical','manage','delegate','background','share_background','disclose','cancel','resolve','external'] loop
  if p_rights->k='true' and previous->k<>'true' then
   if p_user=auth.uid() or actor_rights->k<>'true' then raise sqlstate 'PT403' using message='You cannot confer authority beyond your current delegation.'; end if;
   if k in ('manage','delegate') and actor_rights->'delegate'<>'true' then raise sqlstate 'PT403' using message='Onward management delegation is required.'; end if;
   if k in ('background','share_background') and actor_rights->'share_background'<>'true' then raise sqlstate 'PT403' using message='Restricted information authorization is required.'; end if;
  end if;
 end loop;
 if (p_rights->'practical' is distinct from previous->'practical') and actor_rights->>'preset'<>'coordinator' then raise sqlstate 'PT403' using message='Coordination scope is required for audience changes.'; end if;
 if p_rights->'practical'='true' and previous->'practical'='false' and actor_rights->'disclose'<>'true' then raise sqlstate 'PT403' using message='Broadening practical access requires disclosure authority.'; end if;
 end if;
 select coalesce(m.label,i.recipient,s.inviter_label) into label from private.prompting_scopes q
 left join private.scope_involvement m on m.scope_id=q.id and m.user_id=p_user
 left join private.prompting_participants p on p.scope_id=q.id and p.user_id=p_user left join private.invitations i on i.id=p.invitation_id where q.id=p_scope;
 insert into private.scope_involvement(scope_id,user_id,label,rights,blocked) values(p_scope,p_user,label,p_rights,p_remove)
 on conflict(scope_id,user_id) do update set rights=excluded.rights,blocked=excluded.blocked;
 if p_remove then update private.prompting_participants set removed_at=coalesce(removed_at,clock_timestamp()) where scope_id=p_scope and user_id=p_user; end if;
 if p_remove or p_rights->'manage'<>'true' or p_rights->'practical'<>'true' then update private.invitations set state='revoked' where scope_id=p_scope and inviter=p_user and state='pending'; end if;
 update private.prompting_scopes set revision=revision+1 where id=p_scope;
 insert into private.participation_history(scope_id,actor,operation,action,input,before_state,after_state) values(p_scope,auth.uid(),p_operation,'involvement',args,previous,jsonb_build_object('rights',p_rights,'removed',p_remove,'kind',p_kind,'source',case when p_kind='direct' then 'Signed-in older adult, own statement' else btrim(p_source) end));
 -- Removing oneself succeeds but returns no protected context.
 if p_remove and p_user=auth.uid() then return null; end if;
 return private.read_scope_context(p_scope);
end $$;

create function private.add_coordination_scope(p_parent uuid,p_description text,p_revision bigint,p_operation uuid) returns uuid
language plpgsql security definer set search_path='' as $$
declare s private.prompting_scopes; r jsonb; h private.participation_history; result uuid;
begin
 select * into s from private.prompting_scopes where id=p_parent for update;
 perform public.check_private_session(); r:=private.involvement(p_parent,auth.uid());
 if r is null or r->>'preset'<>'coordinator' or r->'practical'<>'true' or not exists(select 1 from private.coordination_authorizations where arrangement_id=s.arrangement_id and author=auth.uid()) then raise sqlstate 'PT403' using message='Recorded arrangement coordination scope is required.'; end if;
 select * into h from private.participation_history where actor=auth.uid() and operation=p_operation;
 if found then if h.action<>'scope' or h.scope_id<>p_parent or h.input<>jsonb_build_object('description',p_description,'revision',p_revision) then raise sqlstate 'PT409' using message='Operation already used.'; end if; return (h.after_state->>'id')::uuid; end if;
 if s.revision is distinct from p_revision then raise sqlstate 'PT409' using message='Scope changed. Reopen it.'; end if;
 if p_operation is null or coalesce(btrim(p_description),'')='' or length(p_description)>8000 then raise sqlstate 'PT400' using message='Describe this authorized need scope.'; end if;
 result:=gen_random_uuid();
 insert into private.prompting_scopes(id,arrangement_id,summary,permission_kind,permission_author,permission_source,inviter_label)
 values(result,s.arrangement_id,s.summary||jsonb_build_object('description',p_description,'location','','date','','time',''),s.permission_kind,auth.uid(),s.permission_source,s.inviter_label);
 insert into private.scope_involvement(scope_id,user_id,label,rights) values(result,auth.uid(),s.inviter_label,r);
 insert into private.participation_history(scope_id,actor,operation,action,input,after_state) values(p_parent,auth.uid(),p_operation,'scope',jsonb_build_object('description',p_description,'revision',p_revision),jsonb_build_object('id',result));
 -- No Helper audience is inferred from a different need.
 return result;
end $$;

create function private.add_practical_audience(p_scope uuid,p_user uuid,p_revision bigint,p_operation uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare s private.prompting_scopes; r jsonb; label text; h private.participation_history; args jsonb;
begin
 select * into s from private.prompting_scopes where id=p_scope for update;
 perform public.check_private_session(); r:=private.involvement(p_scope,auth.uid());
 if r is null or r->>'preset'<>'coordinator' or r->'manage'<>'true' or r->'disclose'<>'true' or not exists(select 1 from private.coordination_authorizations where arrangement_id=s.arrangement_id and author=auth.uid()) then raise sqlstate 'PT403' using message='Applicable coordination and disclosure authority are required.'; end if;
 args:=jsonb_build_object('user',p_user,'revision',p_revision);
 select * into h from private.participation_history where actor=auth.uid() and operation=p_operation;
 if found then if h.action<>'audience' or h.scope_id<>p_scope or h.input<>args then raise sqlstate 'PT409' using message='Operation already used.'; end if; return private.read_scope_context(p_scope); end if;
 if s.revision is distinct from p_revision then raise sqlstate 'PT409' using message='Audience changed. Reopen it.'; end if;
 if p_operation is null or exists(select 1 from private.scope_involvement where scope_id=p_scope and user_id=p_user) or exists(select 1 from private.prompting_participants where scope_id=p_scope and user_id=p_user) then raise sqlstate 'PT403' using message='Existing involvement cannot be restored through a new audience grant.'; end if;
 select coalesce(m.label,i.recipient) into label from private.prompting_scopes q
 left join private.scope_involvement m on m.scope_id=q.id and m.user_id=p_user
 left join private.prompting_participants p on p.scope_id=q.id and p.user_id=p_user left join private.invitations i on i.id=p.invitation_id
 where q.arrangement_id=s.arrangement_id and q.id<>p_scope and private.involvement(q.id,p_user)->'practical'='true' limit 1;
 if label is null then raise sqlstate 'PT403' using message='Invite a recipient before adding them within this authorized arrangement.'; end if;
 insert into private.scope_involvement(scope_id,user_id,label,rights) values(p_scope,p_user,label,private.helper_rights());
 update private.prompting_scopes set revision=revision+1 where id=p_scope;
 insert into private.participation_history(scope_id,actor,operation,action,input,after_state) values(p_scope,auth.uid(),p_operation,'audience',args,private.helper_rights());
 return private.read_scope_context(p_scope);
end $$;

create function private.write_scope_information(p_scope uuid,p_practical jsonb,p_background text,p_revision bigint,p_operation uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare s private.prompting_scopes; r jsonb; args jsonb; h private.participation_history; k text;
begin
 select * into s from private.prompting_scopes where id=p_scope for update;
 perform public.check_private_session(); r:=private.involvement(p_scope,auth.uid());
 if r is null or r->>'preset'<>'coordinator' or r->'practical'<>'true' then raise sqlstate 'PT403' using message='Current coordination scope is required.'; end if;
 args:=jsonb_build_object('practical',p_practical,'background',p_background,'revision',p_revision);
 select * into h from private.participation_history where actor=auth.uid() and operation=p_operation;
 if found then if h.scope_id<>p_scope or h.action<>'information' or h.input<>args then raise sqlstate 'PT409' using message='Operation already used.'; end if; return private.read_scope_context(p_scope); end if;
 if s.revision is distinct from p_revision then raise sqlstate 'PT409' using message='Information changed. Reopen it before trying again.'; end if;
 if p_operation is null or p_practical is null or jsonb_typeof(p_practical)<>'object' or (select count(*) from jsonb_object_keys(p_practical))<>6 then raise sqlstate 'PT400' using message='Invalid practical information.'; end if;
 foreach k in array array['olderAdult','description','location','date','time','timeZone'] loop
 if jsonb_typeof(p_practical->k) is distinct from 'string' or length(p_practical->>k)>8000 then raise sqlstate 'PT400' using message='Invalid practical information.'; end if;
 end loop;
 if p_background is not null then
 if r->'background'<>'true' or length(p_background)>8000 then raise sqlstate 'PT403' using message='Restricted information authorization is required.'; end if;
 insert into private.scope_background values(p_scope,p_background) on conflict(scope_id) do update set content=excluded.content;
 end if;
 update private.prompting_scopes set summary=p_practical,revision=revision+1 where id=p_scope;
 insert into private.participation_history(scope_id,actor,operation,action,input,before_state,after_state) values(p_scope,auth.uid(),p_operation,'information',args,s.summary,p_practical);
 return private.read_scope_context(p_scope);
end $$;

create function private.suggest_helper(p_scope uuid,p_address text,p_operation uuid) returns boolean
language plpgsql security definer set search_path='' as $$
declare r jsonb; h private.participation_history;
begin
 perform 1 from private.prompting_scopes where id=p_scope for update;
 perform public.check_private_session(); r:=private.involvement(p_scope,auth.uid());
 if r is null or r->'practical'<>'true' then raise sqlstate 'PT403' using message='Current participation is required.'; end if;
 p_address:=lower(btrim(p_address));
 if p_operation is null or p_address is null or length(p_address)>254 or p_address !~ '^[^[:space:]@]+@example[.]test$' then raise sqlstate 'PT400' using message='Use a fictional helper address.'; end if;
 select * into h from private.participation_history where actor=auth.uid() and operation=p_operation;
 if found then if h.action<>'suggestion' or h.scope_id<>p_scope or h.input<>to_jsonb(p_address) then raise sqlstate 'PT409' using message='Operation already used.'; end if; return true; end if;
 insert into private.helper_suggestions(scope_id,author,address) values(p_scope,auth.uid(),p_address);
 insert into private.participation_history(scope_id,actor,operation,action,input) values(p_scope,auth.uid(),p_operation,'suggestion',to_jsonb(p_address));
 return true;
end $$;

create function private.list_participation() returns jsonb language plpgsql security definer set search_path='' as $$
begin
 perform public.check_private_session();
 return coalesce((select jsonb_agg(x) from (
 select s.id,s.arrangement_id,case when private.involvement(s.id,auth.uid())->'practical'='true' then s.summary->>'description' else 'Practical access is restricted' end as title,true as prepared
 from private.prompting_scopes s where private.involvement(s.id,auth.uid()) is not null
 union all select a.id,a.id,a.draft->>'description',false from public.private_arrangements a where a.owner_id=auth.uid() and not exists(select 1 from private.prompting_scopes s where s.arrangement_id=a.id)
 ) x),'[]'::jsonb);
end $$;

create or replace function private.prepare_invitation_scope(p_scope uuid,p_kind text,p_source text,p_delegation boolean)
returns jsonb language plpgsql security definer set search_path='' as $$
declare d jsonb; s private.prompting_scopes;
begin
 perform public.check_private_session();
 select draft into d from public.private_arrangements where id=p_scope and owner_id=auth.uid() for update;
 perform public.check_private_session();
 if d is null or p_kind is null or p_kind not in ('direct','reported') or coalesce(btrim(p_source),'')='' or length(p_source)>254 or p_delegation is distinct from true then
 raise sqlstate 'PT403' using message='Record applicable permission and delegation first.'; end if;
 if p_kind='direct' then p_source:='Signed-in older adult, own statement'; end if;
 insert into private.prompting_scopes(id,arrangement_id,summary,permission_kind,permission_author,permission_source,inviter_label)
 values(p_scope,p_scope,jsonb_build_object('olderAdult',d->>'olderAdult','description',d->>'description','location',d->>'location','date',d->>'date','time',d->>'time','timeZone',d->>'timeZone'),p_kind,auth.uid(),btrim(p_source),(select email from auth.users where id=auth.uid())) on conflict(id) do nothing;
 select * into s from private.prompting_scopes where id=p_scope;
 if s.permission_kind<>p_kind or s.permission_source<>btrim(p_source) then raise sqlstate 'PT409' using message='Permission already recorded. Reopen it.'; end if;
 return jsonb_build_object('id',s.id,'summary',s.summary);
end $$;
create or replace function private.read_prompting_summary(p_scope uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare s private.prompting_scopes;
begin
 perform public.check_private_session();
 select * into s from private.prompting_scopes where id=p_scope for share;
 perform public.check_private_session();
 if private.involvement(p_scope,auth.uid())->'practical' is distinct from 'true'::jsonb then raise sqlstate 'PT403' using message='This request is unavailable.'; end if;
 return jsonb_build_object('id',s.id,'summary',s.summary,'inviter',s.inviter_label,'recorded_at',s.recorded_at);
end $$;
create or replace function private.join_invitation(p_token text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare i private.invitations; s private.prompting_scopes; email text; confirmed timestamptz; removed timestamptz;
begin
 perform public.check_private_session();
 select * into i from private.invitations where token_hash=encode(extensions.digest(p_token,'sha256'),'hex');
 if not found then raise sqlstate 'PT403' using message='This invitation is unavailable. Sign in with the intended address or ask for a new invitation.'; end if;
 select * into s from private.prompting_scopes where id=i.scope_id for update;
 perform public.check_private_session();
 select * into i from private.invitations where id=i.id for update;
 perform public.check_private_session();
 select lower(btrim(u.email)),u.email_confirmed_at into email,confirmed from auth.users u where u.id=auth.uid() for share;
 perform public.check_private_session();
 select removed_at into removed from private.prompting_participants where scope_id=s.id and user_id=auth.uid();
 if not s.shareable or removed is not null then raise sqlstate 'PT403' using message='This invitation is unavailable. Sign in with the intended address or ask for a new invitation.'; end if;
 if i.state='joined' then
 if i.joined_by<>auth.uid() or not exists(select 1 from private.prompting_participants where scope_id=s.id and user_id=auth.uid() and removed_at is null) then raise sqlstate 'PT403' using message='This invitation is unavailable. Sign in with the intended address or ask for a new invitation.'; end if;
 return private.read_prompting_summary(s.id); end if;
 -- Recipient email binds only the initial grant. Consumed retries follow joined_by.
 if confirmed is null or email is distinct from i.recipient then raise sqlstate 'PT403' using message='This invitation is unavailable. Sign in with the intended address or ask for a new invitation.'; end if;
 if i.state<>'pending' or clock_timestamp()>=i.expires_at or private.involvement(s.id,i.inviter)->'manage' is distinct from 'true'::jsonb then raise sqlstate 'PT403' using message='This invitation is unavailable. Sign in with the intended address or ask for a new invitation.'; end if;
 insert into private.prompting_participants(scope_id,user_id,invitation_id) values(s.id,auth.uid(),i.id) on conflict(scope_id,user_id) do nothing;
 update private.invitations set state='joined',joined_by=auth.uid(),joined_at=clock_timestamp() where id=i.id;
 return private.read_prompting_summary(s.id);
end $$;
create or replace function private.issue_invitation(p_scope uuid,p_recipient text,p_operation uuid,p_token text)
returns uuid language plpgsql security definer set search_path='' as $$
declare s private.prompting_scopes; i private.invitations; issued timestamptz;
begin
 perform public.check_private_session();
 select * into s from private.prompting_scopes where id=p_scope for update;
 perform public.check_private_session();
 if private.involvement(p_scope,auth.uid())->'manage' is distinct from 'true'::jsonb or private.involvement(p_scope,auth.uid())->'practical' is distinct from 'true'::jsonb or (s.permission_author<>auth.uid() and private.involvement(p_scope,auth.uid())->'disclose' is distinct from 'true'::jsonb) then raise sqlstate 'PT403' using message='Current sharing authority is required.'; end if;
 p_recipient:=lower(btrim(p_recipient));
 if p_recipient is null or p_recipient !~ '^[^[:space:]@]+@example[.]test$' or length(p_recipient)>254 or p_token is null or p_token !~ '^[a-f0-9]{64}$' or p_operation is null then raise sqlstate 'PT400' using message='Use a fictional recipient and valid operation.'; end if;
 select * into i from private.invitations where inviter=auth.uid() and operation=p_operation;
 if found then
 if i.scope_id<>p_scope or i.recipient<>p_recipient or i.token_hash<>encode(extensions.digest(p_token,'sha256'),'hex') then raise sqlstate 'PT409' using message='Operation already used.'; end if;
 return i.id; end if;
 update private.invitations set state='replaced' where scope_id=p_scope and recipient=p_recipient and state='pending';
 issued:=clock_timestamp();
 insert into private.invitations(scope_id,inviter,recipient,operation,token_hash,issued_at,expires_at) values(p_scope,auth.uid(),p_recipient,p_operation,encode(extensions.digest(p_token,'sha256'),'hex'),issued,issued+interval '168 hours') returning id into i.id;
 return i.id;
end $$;
create or replace function private.manage_invitation_scope(p_scope uuid,p_action text,p_target uuid default null) returns boolean
language plpgsql security definer set search_path='' as $$
declare s private.prompting_scopes;
begin
 perform public.check_private_session();
 select * into s from private.prompting_scopes where id=p_scope for update;
 perform public.check_private_session();
 if s.permission_author<>auth.uid() or private.involvement(p_scope,auth.uid())->'manage' is distinct from 'true'::jsonb then raise sqlstate 'PT403' using message='Current participation-management authority is required.'; end if;
 if p_action='remove' then
 update private.prompting_participants set removed_at=coalesce(removed_at,clock_timestamp()) where scope_id=p_scope and user_id=p_target;
 elsif p_action='revoke' then
 update private.invitations set state='revoked' where scope_id=p_scope and id=p_target and state='pending';
 elsif p_action in ('withdraw','end-authority') then
 update private.prompting_scopes set shareable=case when p_action='withdraw' then false else shareable end,authority_active=false where id=p_scope;
 update private.invitations set state='revoked' where scope_id=p_scope and state='pending';
 else raise sqlstate 'PT400' using message='Unknown action.'; end if;
 update private.prompting_scopes set revision=revision+1 where id=p_scope;
 return true;
end $$;
create or replace function private.list_invitation_scope(p_scope uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare s private.prompting_scopes;
begin
 perform public.check_private_session();
 select * into s from private.prompting_scopes where id=p_scope and permission_author=auth.uid() for share;
 perform public.check_private_session();
 if s.id is null or private.involvement(p_scope,auth.uid())->'manage' is distinct from 'true'::jsonb then return null; end if;
 return jsonb_build_object('id',s.id,'summary',s.summary,'permission_kind',s.permission_kind,'permission_source',s.permission_source,'recorded_at',s.recorded_at,'authority_active',s.authority_active,'shareable',s.shareable,
 'invitations',coalesce((select jsonb_agg(jsonb_build_object('id',id,'recipient',recipient,'state',state,'expires_at',expires_at)) from private.invitations where scope_id=p_scope),'[]'::jsonb),
 'participants',coalesce((select jsonb_agg(jsonb_build_object('user_id',p.user_id,'label',i.recipient,'removed',p.removed_at is not null)) from private.prompting_participants p join private.invitations i on i.id=p.invitation_id and i.scope_id=p.scope_id where p.scope_id=p_scope),'[]'::jsonb));
end $$;

revoke all on function private.helper_rights() from public,anon,authenticated;

revoke all on function private.valid_involvement(jsonb) from public,anon,authenticated;

revoke all on function private.involvement(uuid,uuid) from public,anon,authenticated;

revoke all on function private.read_scope_context(uuid) from public,anon,authenticated;
grant execute on function private.read_scope_context(uuid) to authenticated;
create function public.read_scope_context(p_scope uuid) returns jsonb language sql security invoker set search_path='' as $$ select private.read_scope_context(p_scope); $$;
revoke all on function public.read_scope_context(uuid) from public,anon;
grant execute on function public.read_scope_context(uuid) to authenticated;

revoke all on function private.start_coordination(uuid,text,text,jsonb,uuid) from public,anon,authenticated;
grant execute on function private.start_coordination(uuid,text,text,jsonb,uuid) to authenticated;
create function public.start_coordination(p_arrangement uuid,p_kind text,p_source text,p_rights jsonb,p_operation uuid) returns uuid language sql security invoker set search_path='' as $$ select private.start_coordination(p_arrangement,p_kind,p_source,p_rights,p_operation); $$;
revoke all on function public.start_coordination(uuid,text,text,jsonb,uuid) from public,anon;
grant execute on function public.start_coordination(uuid,text,text,jsonb,uuid) to authenticated;

revoke all on function private.change_involvement(uuid,uuid,jsonb,boolean,text,text,bigint,uuid) from public,anon,authenticated;
grant execute on function private.change_involvement(uuid,uuid,jsonb,boolean,text,text,bigint,uuid) to authenticated;
create function public.change_involvement(p_scope uuid,p_user uuid,p_rights jsonb,p_remove boolean,p_kind text,p_source text,p_revision bigint,p_operation uuid) returns jsonb language sql security invoker set search_path='' as $$ select private.change_involvement(p_scope,p_user,p_rights,p_remove,p_kind,p_source,p_revision,p_operation); $$;
revoke all on function public.change_involvement(uuid,uuid,jsonb,boolean,text,text,bigint,uuid) from public,anon;
grant execute on function public.change_involvement(uuid,uuid,jsonb,boolean,text,text,bigint,uuid) to authenticated;

revoke all on function private.add_coordination_scope(uuid,text,bigint,uuid) from public,anon,authenticated;
grant execute on function private.add_coordination_scope(uuid,text,bigint,uuid) to authenticated;
create function public.add_coordination_scope(p_parent uuid,p_description text,p_revision bigint,p_operation uuid) returns uuid language sql security invoker set search_path='' as $$ select private.add_coordination_scope(p_parent,p_description,p_revision,p_operation); $$;
revoke all on function public.add_coordination_scope(uuid,text,bigint,uuid) from public,anon;
grant execute on function public.add_coordination_scope(uuid,text,bigint,uuid) to authenticated;

revoke all on function private.add_practical_audience(uuid,uuid,bigint,uuid) from public,anon,authenticated;
grant execute on function private.add_practical_audience(uuid,uuid,bigint,uuid) to authenticated;
create function public.add_practical_audience(p_scope uuid,p_user uuid,p_revision bigint,p_operation uuid) returns jsonb language sql security invoker set search_path='' as $$ select private.add_practical_audience(p_scope,p_user,p_revision,p_operation); $$;
revoke all on function public.add_practical_audience(uuid,uuid,bigint,uuid) from public,anon;
grant execute on function public.add_practical_audience(uuid,uuid,bigint,uuid) to authenticated;

revoke all on function private.write_scope_information(uuid,jsonb,text,bigint,uuid) from public,anon,authenticated;
grant execute on function private.write_scope_information(uuid,jsonb,text,bigint,uuid) to authenticated;
create function public.write_scope_information(p_scope uuid,p_practical jsonb,p_background text,p_revision bigint,p_operation uuid) returns jsonb language sql security invoker set search_path='' as $$ select private.write_scope_information(p_scope,p_practical,p_background,p_revision,p_operation); $$;
revoke all on function public.write_scope_information(uuid,jsonb,text,bigint,uuid) from public,anon;
grant execute on function public.write_scope_information(uuid,jsonb,text,bigint,uuid) to authenticated;

revoke all on function private.suggest_helper(uuid,text,uuid) from public,anon,authenticated;
grant execute on function private.suggest_helper(uuid,text,uuid) to authenticated;
create function public.suggest_helper(p_scope uuid,p_address text,p_operation uuid) returns boolean language sql security invoker set search_path='' as $$ select private.suggest_helper(p_scope,p_address,p_operation); $$;
revoke all on function public.suggest_helper(uuid,text,uuid) from public,anon;
grant execute on function public.suggest_helper(uuid,text,uuid) to authenticated;

revoke all on function private.list_participation() from public,anon,authenticated;
grant execute on function private.list_participation() to authenticated;
create function public.list_participation() returns jsonb language sql security invoker set search_path='' as $$ select private.list_participation(); $$;
revoke all on function public.list_participation() from public,anon;
grant execute on function public.list_participation() to authenticated;
notify pgrst, 'reload schema';
