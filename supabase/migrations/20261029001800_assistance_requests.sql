-- Ticket 05: bounded single-person opportunities, not completion or plan changes.
create table private.assistance_requests (
 scope_id uuid primary key references private.prompting_scopes(id),
 instructions text not null default '',
 scheduled_at timestamptz,
 schedule_zone text,
 local_date text not null default '',
 local_time text not null default '',
 material_revision bigint not null default 0,
 created_by uuid not null references auth.users(id),
 created_at timestamptz not null default clock_timestamp(),
 check ((scheduled_at is null and schedule_zone is null and local_date='' and local_time='') or
        (scheduled_at is not null and schedule_zone is not null and local_date<>'' and local_time<>''))
);
create table private.assistance_audience (
 scope_id uuid not null references private.assistance_requests(scope_id),
 user_id uuid not null references auth.users(id),
 added_by uuid not null references auth.users(id),
 added_at timestamptz not null default clock_timestamp(),
 primary key(scope_id,user_id)
);
create table private.ongoing_helper_audience (
 arrangement_id uuid not null references public.private_arrangements(id),
 user_id uuid not null references auth.users(id),
 authorized_by uuid not null references auth.users(id),
 authorized_at timestamptz not null default clock_timestamp(),
 primary key(arrangement_id,user_id)
);
create table private.assistance_commitments (
 scope_id uuid primary key references private.assistance_requests(scope_id),
 performer uuid not null references auth.users(id),
 accepted_at timestamptz not null default clock_timestamp(),
 operation uuid not null unique
);
create table private.assistance_responses (
 scope_id uuid not null references private.assistance_requests(scope_id),
 user_id uuid not null references auth.users(id),
 answer text not null check(answer in ('declined','deferred')),
 answered_at timestamptz not null default clock_timestamp(),
 primary key(scope_id,user_id)
);
create table private.assistance_operations (
 actor uuid not null references auth.users(id), operation uuid not null,
 action text not null, input jsonb not null, outcome jsonb not null,
 recorded_at timestamptz not null default clock_timestamp(),
 primary key(actor,operation)
);
revoke all on all tables in schema private from public,anon,authenticated;

create function private.assistance_receipt(p_operation uuid,p_action text,p_input jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare receipt private.assistance_operations;
begin
 if p_operation is null then raise sqlstate 'PT400' using message='An operation identity is required.'; end if;
 select * into receipt from private.assistance_operations where actor=auth.uid() and operation=p_operation;
 if not found then return null; end if;
 if receipt.action<>p_action or receipt.input<>p_input then raise sqlstate 'PT409' using message='Operation already used with different contents.'; end if;
 return receipt.outcome;
end $$;
create function private.save_assistance_receipt(p_operation uuid,p_action text,p_input jsonb,p_outcome jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
begin
 insert into private.assistance_operations(actor,operation,action,input,outcome)
 values(auth.uid(),p_operation,p_action,p_input,p_outcome);
 return p_outcome;
end $$;

-- Count all valid instants for a wall time; PostgreSQL's default gap/fold coercion is not accepted.
create function private.assistance_instant(p_date text,p_time text,p_zone text)
returns timestamptz language plpgsql stable security definer set search_path='' as $$
declare d text[]; t text[]; wall timestamp; candidate timestamptz; matches integer:=0; result timestamptz;
begin
 if coalesce(p_date,'')='' and coalesce(p_time,'')='' then return null; end if;
 d:=regexp_match(coalesce(p_date,''),'^([0-9]{1,2})/([0-9]{1,2})/([0-9]{4})$');
 t:=regexp_match(coalesce(p_time,''),'^([0-9]{1,2}):([0-9]{2}) ?([AaPp][Mm])$');
 if d is null or t is null or t[1]::int not between 1 and 12 or t[2]::int not between 0 and 59 or
    not exists(select 1 from pg_catalog.pg_timezone_names where name=p_zone and (name='UTC' or name like '%/%')) then
  raise sqlstate 'PT400' using message='Enter a real date, time and named time zone, or leave all three blank.';
 end if;
 begin
  wall:=make_timestamp(d[3]::int,d[1]::int,d[2]::int,(t[1]::int%12)+case when lower(t[3])='pm' then 12 else 0 end,t[2]::int,0);
 exception when others then
  raise sqlstate 'PT400' using message='Enter a real calendar date and time.';
 end;
 for candidate in select (wall-make_interval(mins=>offset_minutes)) at time zone 'UTC'
                  from generate_series(-840,840,15) as offset_minutes loop
  if timezone(p_zone,candidate)=wall then matches:=matches+1; result:=candidate; end if;
 end loop;
 if matches<>1 then
  raise sqlstate 'PT400' using message=case when matches=0 then
   'That local time does not occur because the clocks change. Choose another time or leave it unscheduled.' else
   'That local time occurs twice because the clocks change. Choose another time or leave it unscheduled.' end;
 end if;
 return result;
end $$;

-- Existing ticket 04 information RPCs remain usable for unrelated content. They cannot
-- bypass the accepted-work freeze or write a second, unsynchronized schedule.
create function private.guard_assistance_summary() returns trigger language plpgsql security definer set search_path='' as $$
declare material_changed boolean; schedule_changed boolean;
begin
 material_changed:=old.summary->>'description' is distinct from new.summary->>'description' or
  old.summary->>'location' is distinct from new.summary->>'location' or
  old.summary->>'date' is distinct from new.summary->>'date' or
  old.summary->>'time' is distinct from new.summary->>'time' or
  old.summary->>'timeZone' is distinct from new.summary->>'timeZone';
 schedule_changed:=old.summary->>'date' is distinct from new.summary->>'date' or
  old.summary->>'time' is distinct from new.summary->>'time' or
  old.summary->>'timeZone' is distinct from new.summary->>'timeZone';
 if material_changed and exists(select 1 from private.assistance_commitments where scope_id=old.id) then
  raise sqlstate 'PT409' using message='Accepted work cannot be changed here. Arrange an explicit change later.';
 end if;
 if schedule_changed and exists(select 1 from private.assistance_requests where scope_id=old.id) and
    current_setting('private.assistance_schedule_write',true) is distinct from 'on' then
  raise sqlstate 'PT409' using message='Use the scheduled need editor to change this time.';
 end if;
 if material_changed and current_setting('private.assistance_schedule_write',true) is distinct from 'on' then
  update private.assistance_requests set material_revision=material_revision+1 where scope_id=old.id;
 end if;
 return new;
end $$;
create trigger guard_assistance_summary before update of summary on private.prompting_scopes
for each row execute function private.guard_assistance_summary();

create function private.inherit_assistance_audience(p_scope uuid,p_arrangement uuid)
returns void language plpgsql security definer set search_path='' as $$
declare member record; root_scope uuid;
begin
 root_scope:=p_arrangement;
 for member in
  select o.user_id,coalesce(m.label,i.recipient) as label
  from private.ongoing_helper_audience o
  left join private.scope_involvement m on m.scope_id=root_scope and m.user_id=o.user_id
  left join private.prompting_participants p on p.scope_id=root_scope and p.user_id=o.user_id
  left join private.invitations i on i.id=p.invitation_id
  where o.arrangement_id=p_arrangement and private.involvement(root_scope,o.user_id)->>'preset'='helper'
    and private.involvement(root_scope,o.user_id)->'practical'='true'
 loop
  if member.label is not null and member.user_id<>auth.uid() then
   insert into private.scope_involvement(scope_id,user_id,label,rights)
   values(p_scope,member.user_id,member.label,private.helper_rights()) on conflict(scope_id,user_id) do nothing;
   insert into private.assistance_audience(scope_id,user_id,added_by)
   values(p_scope,member.user_id,auth.uid()) on conflict(scope_id,user_id) do nothing;
  end if;
 end loop;
end $$;

create function private.create_assistance_request(p_scope uuid,p_task text,p_place text,p_instructions text,
 p_date text,p_time text,p_zone text,p_revision bigint,p_operation uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare s private.prompting_scopes; r jsonb; instant timestamptz; args jsonb; receipt jsonb; result jsonb;
begin
 perform private.lock_participation_arrangement(p_scope);
 select * into s from private.prompting_scopes where id=p_scope for update;
 perform public.check_private_session(); r:=private.involvement(p_scope,auth.uid());
 if r is null or r->>'preset'<>'coordinator' or r->'practical'<>'true' then raise sqlstate 'PT403' using message='Current coordination scope is required.'; end if;
 args:=jsonb_build_object('scope',p_scope,'task',p_task,'place',p_place,'instructions',p_instructions,'date',p_date,'time',p_time,'zone',p_zone,'revision',p_revision);
 receipt:=private.assistance_receipt(p_operation,'create-request',args);
 if receipt is not null then return receipt; end if;
 if s.revision is distinct from p_revision or exists(select 1 from private.assistance_requests where scope_id=p_scope) then raise sqlstate 'PT409' using message='This need changed. Reopen it.'; end if;
 if coalesce(btrim(p_task),'')='' or length(p_task)>8000 or p_place is null or length(p_place)>8000 or p_instructions is null or length(p_instructions)>8000 then raise sqlstate 'PT400' using message='Add a brief task and optional practical details.'; end if;
 instant:=private.assistance_instant(p_date,p_time,p_zone);
 if instant is null then p_date:=''; p_time:=''; p_zone:=''; end if;
 update private.prompting_scopes set summary=summary||jsonb_build_object('description',btrim(p_task),'location',p_place,'date',p_date,'time',p_time,'timeZone',p_zone),revision=revision+1 where id=p_scope;
 insert into private.assistance_requests(scope_id,instructions,scheduled_at,schedule_zone,local_date,local_time,created_by)
 values(p_scope,p_instructions,instant,nullif(p_zone,''),p_date,p_time,auth.uid());
 perform private.inherit_assistance_audience(p_scope,s.arrangement_id);
 result:=jsonb_build_object('id',p_scope,'created',true);
 return private.save_assistance_receipt(p_operation,'create-request',args,result);
end $$;

create function private.create_assistance_need(p_root uuid,p_task text,p_place text,p_instructions text,
 p_date text,p_time text,p_zone text,p_revision bigint,p_operation uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare root_scope private.prompting_scopes; r jsonb; instant timestamptz; args jsonb; receipt jsonb; new_scope uuid; result jsonb;
begin
 perform private.lock_participation_arrangement(p_root);
 select * into root_scope from private.prompting_scopes where id=p_root for update;
 perform public.check_private_session(); r:=private.involvement(p_root,auth.uid());
 if root_scope.id is null or root_scope.id<>root_scope.arrangement_id or r is null or r->>'preset'<>'coordinator' or r->'practical'<>'true' then raise sqlstate 'PT403' using message='Current ongoing coordination scope is required.'; end if;
 args:=jsonb_build_object('root',p_root,'task',p_task,'place',p_place,'instructions',p_instructions,'date',p_date,'time',p_time,'zone',p_zone,'revision',p_revision);
 receipt:=private.assistance_receipt(p_operation,'create-need',args);
 if receipt is not null then return receipt; end if;
 if root_scope.revision is distinct from p_revision then raise sqlstate 'PT409' using message='Coordination context changed. Reopen it.'; end if;
 if coalesce(btrim(p_task),'')='' or length(p_task)>8000 or p_place is null or length(p_place)>8000 or p_instructions is null or length(p_instructions)>8000 then raise sqlstate 'PT400' using message='Add a brief task and optional practical details.'; end if;
 instant:=private.assistance_instant(p_date,p_time,p_zone);
 if instant is null then p_date:=''; p_time:=''; p_zone:=''; end if;
 new_scope:=gen_random_uuid();
 insert into private.prompting_scopes(id,arrangement_id,summary,permission_kind,permission_author,permission_source,inviter_label)
 values(new_scope,p_root,root_scope.summary||jsonb_build_object('description',btrim(p_task),'location',p_place,'date',p_date,'time',p_time,'timeZone',p_zone),
 root_scope.permission_kind,auth.uid(),root_scope.permission_source,root_scope.inviter_label);
 insert into private.scope_involvement(scope_id,user_id,label,rights) values(new_scope,auth.uid(),root_scope.inviter_label,r);
 insert into private.assistance_requests(scope_id,instructions,scheduled_at,schedule_zone,local_date,local_time,created_by)
 values(new_scope,p_instructions,instant,nullif(p_zone,''),p_date,p_time,auth.uid());
 perform private.inherit_assistance_audience(new_scope,p_root);
 result:=jsonb_build_object('id',new_scope,'created',true);
 return private.save_assistance_receipt(p_operation,'create-need',args,result);
end $$;

create function private.update_assistance_request(p_scope uuid,p_task text,p_place text,p_instructions text,
 p_date text,p_time text,p_zone text,p_material_revision bigint,p_operation uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare s private.prompting_scopes; req private.assistance_requests; r jsonb; instant timestamptz; args jsonb; receipt jsonb; result jsonb;
begin
 perform private.lock_participation_arrangement(p_scope);
 select * into s from private.prompting_scopes where id=p_scope for update;
 select * into req from private.assistance_requests where scope_id=p_scope for update;
 perform public.check_private_session(); r:=private.involvement(p_scope,auth.uid());
 if req.scope_id is null or r is null or r->>'preset'<>'coordinator' or r->'practical'<>'true' then raise sqlstate 'PT403' using message='Current coordination scope is required.'; end if;
 args:=jsonb_build_object('scope',p_scope,'task',p_task,'place',p_place,'instructions',p_instructions,'date',p_date,'time',p_time,'zone',p_zone,'revision',p_material_revision);
 receipt:=private.assistance_receipt(p_operation,'update-request',args);
 if receipt is not null then return receipt; end if;
 if req.material_revision is distinct from p_material_revision then raise sqlstate 'PT409' using message='Need details changed. Reopen them before saving.'; end if;
 if exists(select 1 from private.assistance_commitments where scope_id=p_scope) then raise sqlstate 'PT409' using message='Accepted work cannot be changed here. Arrange an explicit change later.'; end if;
 if coalesce(btrim(p_task),'')='' or length(p_task)>8000 or p_place is null or length(p_place)>8000 or p_instructions is null or length(p_instructions)>8000 then raise sqlstate 'PT400' using message='Add a brief task and optional practical details.'; end if;
 instant:=private.assistance_instant(p_date,p_time,p_zone);
 if instant is null then p_date:=''; p_time:=''; p_zone:=''; end if;
 perform set_config('private.assistance_schedule_write','on',true);
 update private.prompting_scopes set summary=summary||jsonb_build_object('description',btrim(p_task),'location',p_place,'date',p_date,'time',p_time,'timeZone',p_zone),revision=revision+1 where id=p_scope;
 update private.assistance_requests set instructions=p_instructions,scheduled_at=instant,schedule_zone=nullif(p_zone,''),local_date=p_date,local_time=p_time,material_revision=material_revision+1 where scope_id=p_scope;
 perform set_config('private.assistance_schedule_write','off',true);
 result:=jsonb_build_object('id',p_scope,'updated',true);
 return private.save_assistance_receipt(p_operation,'update-request',args,result);
end $$;

create function private.set_ongoing_helper_audience(p_root uuid,p_user uuid,p_include boolean,p_revision bigint,p_operation uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare s private.prompting_scopes; r jsonb; target jsonb; args jsonb; receipt jsonb; result jsonb;
begin
 perform private.lock_participation_arrangement(p_root);
 select * into s from private.prompting_scopes where id=p_root for update;
 perform public.check_private_session(); r:=private.involvement(p_root,auth.uid()); target:=private.involvement(p_root,p_user);
 if s.id is null or s.id<>s.arrangement_id or r is null or r->>'preset'<>'coordinator' or r->'practical'<>'true' or r->'disclose'<>'true' then raise sqlstate 'PT403' using message='Current ongoing coordination and disclosure authority are required.'; end if;
 args:=jsonb_build_object('root',p_root,'user',p_user,'include',p_include,'revision',p_revision);
 receipt:=private.assistance_receipt(p_operation,'ongoing-audience',args);
 if receipt is not null then return receipt; end if;
 if s.revision is distinct from p_revision then raise sqlstate 'PT409' using message='Audience changed. Reopen it.'; end if;
 if p_include is null or p_user=auth.uid() or (p_include and (target is null or target->>'preset'<>'helper' or target->'practical'<>'true')) then raise sqlstate 'PT403' using message='Select an eligible authorized Helper.'; end if;
 if p_include then
  insert into private.ongoing_helper_audience(arrangement_id,user_id,authorized_by) values(p_root,p_user,auth.uid()) on conflict(arrangement_id,user_id) do nothing;
 else
  delete from private.ongoing_helper_audience where arrangement_id=p_root and user_id=p_user;
 end if;
 update private.prompting_scopes set revision=revision+1 where id=p_root;
 result:=jsonb_build_object('ongoing',p_include);
 return private.save_assistance_receipt(p_operation,'ongoing-audience',args,result);
end $$;

create function private.offer_assistance(p_scope uuid,p_user uuid,p_material_revision bigint,p_operation uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare s private.prompting_scopes; req private.assistance_requests; r jsonb; target jsonb; label text; args jsonb; receipt jsonb; result jsonb;
begin
 perform private.lock_participation_arrangement(p_scope);
 select * into s from private.prompting_scopes where id=p_scope for update;
 select * into req from private.assistance_requests where scope_id=p_scope for update;
 perform public.check_private_session(); r:=private.involvement(p_scope,auth.uid()); target:=private.involvement(p_scope,p_user);
 if req.scope_id is null or r is null or r->>'preset'<>'coordinator' or r->'practical'<>'true' or r->'disclose'<>'true' then raise sqlstate 'PT403' using message='Current coordination and disclosure authority are required.'; end if;
 args:=jsonb_build_object('scope',p_scope,'user',p_user,'revision',p_material_revision);
 receipt:=private.assistance_receipt(p_operation,'offer',args);
 if receipt is not null then return receipt; end if;
 if req.material_revision is distinct from p_material_revision then raise sqlstate 'PT409' using message='Opportunity changed. Reopen it.'; end if;
 if exists(select 1 from private.assistance_commitments where scope_id=p_scope) then raise sqlstate 'PT409' using message='This work is already arranged.'; end if;
 if p_user is null or p_user=auth.uid() or exists(select 1 from private.prompting_participants where scope_id=p_scope and user_id=p_user and removed_at is not null) or
    exists(select 1 from private.scope_involvement where scope_id=p_scope and user_id=p_user and blocked) then raise sqlstate 'PT403' using message='This Helper is unavailable.'; end if;
 select coalesce(m.label,i.recipient) into label from private.prompting_scopes q
 left join private.scope_involvement m on m.scope_id=q.id and m.user_id=p_user
 left join private.prompting_participants p on p.scope_id=q.id and p.user_id=p_user
 left join private.invitations i on i.id=p.invitation_id
 where q.arrangement_id=s.arrangement_id and private.involvement(q.id,p_user)->'practical'='true' limit 1;
 if label is null then raise sqlstate 'PT403' using message='Invite an eligible Helper into this arrangement first.'; end if;
 if target is null then
  insert into private.scope_involvement(scope_id,user_id,label,rights) values(p_scope,p_user,label,private.helper_rights());
 elsif target->'practical'<>'true' then
  insert into private.scope_involvement(scope_id,user_id,label,rights) values(p_scope,p_user,label,target||'{"practical":true}'::jsonb)
  on conflict(scope_id,user_id) do update set rights=excluded.rights;
 end if;
 insert into private.assistance_audience(scope_id,user_id,added_by) values(p_scope,p_user,auth.uid()) on conflict(scope_id,user_id) do nothing;
 delete from private.assistance_responses where scope_id=p_scope and user_id=p_user;
 update private.assistance_requests set material_revision=material_revision+1 where scope_id=p_scope;
 update private.prompting_scopes set revision=revision+1 where id=p_scope;
 result:=jsonb_build_object('offered',true);
 return private.save_assistance_receipt(p_operation,'offer',args,result);
end $$;

create function private.accept_assistance(p_scope uuid,p_material_revision bigint,p_operation uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare s private.prompting_scopes; req private.assistance_requests; r jsonb; prior private.assistance_commitments; args jsonb; receipt jsonb; result jsonb;
begin
 perform private.lock_participation_arrangement(p_scope);
 select * into s from private.prompting_scopes where id=p_scope for update;
 select * into req from private.assistance_requests where scope_id=p_scope for update;
 perform public.check_private_session(); r:=private.involvement(p_scope,auth.uid());
 if req.scope_id is null or not s.shareable or r is null or r->'practical'<>'true' or r->>'preset' not in ('helper','coordinator') or
    not exists(select 1 from private.assistance_audience where scope_id=p_scope and user_id=auth.uid()) then
  raise sqlstate 'PT403' using message='This opportunity is unavailable with current authorization.';
 end if;
 args:=jsonb_build_object('scope',p_scope,'revision',p_material_revision);
 receipt:=private.assistance_receipt(p_operation,'accept',args);
 if receipt is not null then return receipt; end if;
 select * into prior from private.assistance_commitments where scope_id=p_scope;
 if found then
  result:=jsonb_build_object('outcome',case when prior.performer=auth.uid() then 'accepted' else 'already-arranged' end,
   'scope',p_scope);
  return private.save_assistance_receipt(p_operation,'accept',args,result);
 end if;
 if req.material_revision is distinct from p_material_revision then raise sqlstate 'PT409' using message='Opportunity details changed. Reopen before accepting.'; end if;
 insert into private.assistance_commitments(scope_id,performer,operation) values(p_scope,auth.uid(),p_operation);
 delete from private.assistance_responses where scope_id=p_scope and user_id=auth.uid();
 result:=jsonb_build_object('outcome','accepted','scope',p_scope);
 return private.save_assistance_receipt(p_operation,'accept',args,result);
end $$;

create function private.answer_assistance(p_scope uuid,p_answer text,p_material_revision bigint,p_operation uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare s private.prompting_scopes; req private.assistance_requests; r jsonb; args jsonb; receipt jsonb; result jsonb;
begin
 perform private.lock_participation_arrangement(p_scope);
 select * into s from private.prompting_scopes where id=p_scope for update;
 select * into req from private.assistance_requests where scope_id=p_scope for update;
 perform public.check_private_session(); r:=private.involvement(p_scope,auth.uid());
 if req.scope_id is null or not s.shareable or r is null or r->'practical'<>'true' or
    not exists(select 1 from private.assistance_audience where scope_id=p_scope and user_id=auth.uid()) then raise sqlstate 'PT403' using message='This request is unavailable.'; end if;
 args:=jsonb_build_object('scope',p_scope,'answer',p_answer,'revision',p_material_revision);
 receipt:=private.assistance_receipt(p_operation,'answer',args);
 if receipt is not null then return receipt; end if;
 if p_answer not in ('declined','deferred') then raise sqlstate 'PT400' using message='Choose decline or defer.'; end if;
 if exists(select 1 from private.assistance_commitments where scope_id=p_scope) then
  raise sqlstate 'PT409' using message='This work is already accepted. Decline or defer cannot cancel it.';
 end if;
 if req.material_revision is distinct from p_material_revision then raise sqlstate 'PT409' using message='Request details changed. Reopen before answering.'; end if;
 insert into private.assistance_responses(scope_id,user_id,answer) values(p_scope,auth.uid(),p_answer)
 on conflict(scope_id,user_id) do update set answer=excluded.answer,answered_at=clock_timestamp();
 result:=jsonb_build_object('outcome',p_answer);
 return private.save_assistance_receipt(p_operation,'answer',args,result);
end $$;

create function private.read_assistance(p_scope uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare s private.prompting_scopes; req private.assistance_requests; r jsonb; commitment private.assistance_commitments; eligible boolean; coordinator boolean; result jsonb;
begin
 select * into s from private.prompting_scopes where id=p_scope for share;
 perform public.check_private_session(); r:=private.involvement(p_scope,auth.uid());
 if s.id is null or r is null or r->'practical'<>'true' then raise sqlstate 'PT403' using message='This need is unavailable.'; end if;
 coordinator:=r->>'preset'='coordinator';
 select * into req from private.assistance_requests where scope_id=p_scope;
 eligible:=exists(select 1 from private.assistance_audience where scope_id=p_scope and user_id=auth.uid());
 select * into commitment from private.assistance_commitments where scope_id=p_scope;
 if req.scope_id is null and (not coordinator or s.id<>s.arrangement_id) then raise sqlstate 'PT403' using message='This need is unavailable.'; end if;
 if req.scope_id is not null and not coordinator and not eligible and commitment.performer is distinct from auth.uid() then raise sqlstate 'PT403' using message='This opportunity is unavailable.'; end if;
 result:=jsonb_build_object('id',s.id,'arrangement_id',s.arrangement_id,'older_adult',s.summary->>'olderAdult',
  'task',s.summary->>'description','place',s.summary->>'location','instructions',coalesce(req.instructions,''),
  'scheduled_at',req.scheduled_at,'schedule_zone',req.schedule_zone,'local_date',req.local_date,'local_time',req.local_time,
  'material_revision',req.material_revision,'scope_revision',s.revision,'created',req.scope_id is not null,
  'coordinator',coordinator,'can_create_other',coordinator and s.id=s.arrangement_id,
  'can_offer',coordinator and r->'disclose'='true' and req.scope_id is not null and commitment.scope_id is null,
  'eligible',eligible,'accepted_by_me',commitment.performer=auth.uid(),'arranged',commitment.scope_id is not null,
  'accepted_at',commitment.accepted_at,'my_answer',(select answer from private.assistance_responses where scope_id=p_scope and user_id=auth.uid()),
  'audience_count',(select count(*) from private.assistance_audience where scope_id=p_scope));
 if coordinator and r->'disclose'='true' then
  result:=result||jsonb_build_object('candidates',coalesce((select jsonb_agg(x) from (
   select distinct q.user_id,q.label,
    exists(select 1 from private.assistance_audience a where a.scope_id=p_scope and a.user_id=q.user_id) as offered,
    exists(select 1 from private.ongoing_helper_audience o where o.arrangement_id=s.arrangement_id and o.user_id=q.user_id) as ongoing
   from (
    select m.user_id,m.label,m.scope_id from private.scope_involvement m
    union all select p.user_id,i.recipient,p.scope_id from private.prompting_participants p join private.invitations i on i.id=p.invitation_id
   ) q join private.prompting_scopes source_scope on source_scope.id=q.scope_id
   where source_scope.arrangement_id=s.arrangement_id and q.user_id<>auth.uid()
    and (s.id=s.arrangement_id or q.scope_id=s.id)
    and private.involvement(q.scope_id,q.user_id)->'practical'='true'
    and not exists(select 1 from private.prompting_participants blocked where blocked.scope_id=s.id and blocked.user_id=q.user_id and blocked.removed_at is not null)
    and not exists(select 1 from private.scope_involvement blocked where blocked.scope_id=s.id and blocked.user_id=q.user_id and blocked.blocked)
  ) x),'[]'::jsonb));
 end if;
 return result;
end $$;

create function private.list_assistance() returns jsonb language plpgsql security definer set search_path='' as $$
begin
 perform public.check_private_session();
 return coalesce((select jsonb_agg(private.read_assistance(s.id)) from private.prompting_scopes s
  where private.involvement(s.id,auth.uid())->'practical'='true' and
   ((s.id=s.arrangement_id and private.involvement(s.id,auth.uid())->>'preset'='coordinator') or
    exists(select 1 from private.assistance_requests r where r.scope_id=s.id and
      (private.involvement(s.id,auth.uid())->>'preset'='coordinator' or
       exists(select 1 from private.assistance_audience a where a.scope_id=s.id and a.user_id=auth.uid()) or
       exists(select 1 from private.assistance_commitments c where c.scope_id=s.id and c.performer=auth.uid()))))),'[]'::jsonb);
end $$;

revoke all on function private.assistance_receipt(uuid,text,jsonb),private.save_assistance_receipt(uuid,text,jsonb,jsonb),
 private.assistance_instant(text,text,text),private.guard_assistance_summary(),private.inherit_assistance_audience(uuid,uuid),
 private.create_assistance_request(uuid,text,text,text,text,text,text,bigint,uuid),
 private.create_assistance_need(uuid,text,text,text,text,text,text,bigint,uuid),
 private.update_assistance_request(uuid,text,text,text,text,text,text,bigint,uuid),
 private.set_ongoing_helper_audience(uuid,uuid,boolean,bigint,uuid),
 private.offer_assistance(uuid,uuid,bigint,uuid),private.accept_assistance(uuid,bigint,uuid),
 private.answer_assistance(uuid,text,bigint,uuid),private.read_assistance(uuid),private.list_assistance()
 from public,anon,authenticated;
grant execute on function private.create_assistance_request(uuid,text,text,text,text,text,text,bigint,uuid),
 private.create_assistance_need(uuid,text,text,text,text,text,text,bigint,uuid),
 private.update_assistance_request(uuid,text,text,text,text,text,text,bigint,uuid),
 private.set_ongoing_helper_audience(uuid,uuid,boolean,bigint,uuid),
 private.offer_assistance(uuid,uuid,bigint,uuid),private.accept_assistance(uuid,bigint,uuid),
 private.answer_assistance(uuid,text,bigint,uuid),private.read_assistance(uuid),private.list_assistance() to authenticated;

create function public.create_assistance_request(p_scope uuid,p_task text,p_place text,p_instructions text,p_date text,p_time text,p_zone text,p_revision bigint,p_operation uuid)
returns jsonb language sql security invoker set search_path='' as $$ select private.create_assistance_request(p_scope,p_task,p_place,p_instructions,p_date,p_time,p_zone,p_revision,p_operation); $$;
create function public.create_assistance_need(p_root uuid,p_task text,p_place text,p_instructions text,p_date text,p_time text,p_zone text,p_revision bigint,p_operation uuid)
returns jsonb language sql security invoker set search_path='' as $$ select private.create_assistance_need(p_root,p_task,p_place,p_instructions,p_date,p_time,p_zone,p_revision,p_operation); $$;
create function public.update_assistance_request(p_scope uuid,p_task text,p_place text,p_instructions text,p_date text,p_time text,p_zone text,p_material_revision bigint,p_operation uuid)
returns jsonb language sql security invoker set search_path='' as $$ select private.update_assistance_request(p_scope,p_task,p_place,p_instructions,p_date,p_time,p_zone,p_material_revision,p_operation); $$;
create function public.set_ongoing_helper_audience(p_root uuid,p_user uuid,p_include boolean,p_revision bigint,p_operation uuid)
returns jsonb language sql security invoker set search_path='' as $$ select private.set_ongoing_helper_audience(p_root,p_user,p_include,p_revision,p_operation); $$;
create function public.offer_assistance(p_scope uuid,p_user uuid,p_material_revision bigint,p_operation uuid)
returns jsonb language sql security invoker set search_path='' as $$ select private.offer_assistance(p_scope,p_user,p_material_revision,p_operation); $$;
create function public.accept_assistance(p_scope uuid,p_material_revision bigint,p_operation uuid)
returns jsonb language sql security invoker set search_path='' as $$ select private.accept_assistance(p_scope,p_material_revision,p_operation); $$;
create function public.answer_assistance(p_scope uuid,p_answer text,p_material_revision bigint,p_operation uuid)
returns jsonb language sql security invoker set search_path='' as $$ select private.answer_assistance(p_scope,p_answer,p_material_revision,p_operation); $$;
create function public.read_assistance(p_scope uuid) returns jsonb language sql security invoker set search_path='' as $$ select private.read_assistance(p_scope); $$;
create function public.list_assistance() returns jsonb language sql security invoker set search_path='' as $$ select private.list_assistance(); $$;
revoke all on function public.create_assistance_request(uuid,text,text,text,text,text,text,bigint,uuid),
 public.create_assistance_need(uuid,text,text,text,text,text,text,bigint,uuid),
 public.update_assistance_request(uuid,text,text,text,text,text,text,bigint,uuid),
 public.set_ongoing_helper_audience(uuid,uuid,boolean,bigint,uuid),public.offer_assistance(uuid,uuid,bigint,uuid),
 public.accept_assistance(uuid,bigint,uuid),public.answer_assistance(uuid,text,bigint,uuid),
 public.read_assistance(uuid),public.list_assistance() from public,anon;
grant execute on function public.create_assistance_request(uuid,text,text,text,text,text,text,bigint,uuid),
 public.create_assistance_need(uuid,text,text,text,text,text,text,bigint,uuid),
 public.update_assistance_request(uuid,text,text,text,text,text,text,bigint,uuid),
 public.set_ongoing_helper_audience(uuid,uuid,boolean,bigint,uuid),public.offer_assistance(uuid,uuid,bigint,uuid),
 public.accept_assistance(uuid,bigint,uuid),public.answer_assistance(uuid,text,bigint,uuid),
 public.read_assistance(uuid),public.list_assistance() to authenticated;
notify pgrst, 'reload schema';
