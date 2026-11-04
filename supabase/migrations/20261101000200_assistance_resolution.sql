-- Ticket 07: authoritative express resolution, separate from completion and commitment state.
create table private.assistance_resolution_history (
 id bigint generated always as identity primary key,
 scope_id uuid not null references private.prompting_scopes(id),
 actor uuid not null references auth.users(id),
 action text not null check(action in ('resolved','corrected')),
 recorded_at timestamptz not null default clock_timestamp(),
 operation uuid not null unique,
 target_snapshot text not null
);
create index assistance_resolution_history_scope_idx on private.assistance_resolution_history(scope_id,id);
create table private.assistance_resolution_current (
 scope_id uuid primary key references private.prompting_scopes(id),
 history_id bigint not null unique references private.assistance_resolution_history(id),
 resolved boolean not null
);
revoke all on private.assistance_resolution_history,private.assistance_resolution_current from public,anon,authenticated;

create function private.reject_resolution_history_change() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 raise sqlstate 'PT403' using message='Resolution history is append-only.';
end $$;
create trigger resolution_history_append_only before update or delete on private.assistance_resolution_history
for each row execute function private.reject_resolution_history_change();

-- This token describes only the target need. A sibling scope or unrelated display edit cannot stale it.
create function private.assistance_resolution_snapshot(p_scope uuid) returns text
language sql stable security definer set search_path='' as $$
 select md5(jsonb_build_object(
  'created',r.scope_id is not null,
  'material_revision',r.material_revision,
  'prepared_task',case when r.scope_id is null then s.summary->>'description' end,
  'prepared_place',case when r.scope_id is null then s.summary->>'location' end,
  'prepared_date',case when r.scope_id is null then s.summary->>'date' end,
  'prepared_time',case when r.scope_id is null then s.summary->>'time' end,
  'prepared_zone',case when r.scope_id is null then s.summary->>'timeZone' end,
  'available_to',coalesce((select jsonb_agg(a.user_id order by a.user_id)
   from private.assistance_audience a where a.scope_id=p_scope
    and private.involvement(p_scope,a.user_id)->'practical'='true'),'[]'::jsonb),
  'commitment',c.operation,'completion',done.operation,
  'resolution',current_state.history_id
 )::text)
 from private.prompting_scopes s
 left join private.assistance_requests r on r.scope_id=s.id
 left join private.assistance_commitments c on c.scope_id=s.id
 left join private.assistance_completion_reports done on done.commitment_operation=c.operation
 left join private.assistance_resolution_current current_state on current_state.scope_id=s.id
 where s.id=p_scope;
$$;
revoke all on function private.reject_resolution_history_change(),private.assistance_resolution_snapshot(uuid) from public,anon,authenticated;

create function private.resolve_assistance(p_scope uuid,p_snapshot text,p_operation uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare s private.prompting_scopes; r jsonb; prior private.assistance_resolution_history;
 args jsonb; receipt jsonb; result jsonb;
begin
 perform private.lock_participation_arrangement(p_scope);
 select * into s from private.prompting_scopes where id=p_scope for update;
 perform public.check_private_session(); r:=private.involvement(p_scope,auth.uid());
 if s.id is null or r is null or r->'practical'<>'true' or r->'resolve'<>'true' then
  raise sqlstate 'PT403' using message='Current need-resolution authority is required.';
 end if;
 args:=jsonb_build_object('scope',p_scope,'snapshot',p_snapshot);
 receipt:=private.assistance_receipt(p_operation,'resolve',args);
 if receipt is not null then return receipt; end if;
 select h.* into prior from private.assistance_resolution_current current_state
 join private.assistance_resolution_history h on h.id=current_state.history_id
 where current_state.scope_id=p_scope and current_state.resolved;
 if found then return jsonb_build_object('id',p_scope,'outcome','already-resolved','resolved_at',prior.recorded_at); end if;
 if p_snapshot is null or private.assistance_resolution_snapshot(p_scope) is distinct from p_snapshot then
  raise sqlstate 'PT409' using message='This need changed. Review current details before resolving.';
 end if;
 insert into private.assistance_resolution_history(scope_id,actor,action,operation,target_snapshot)
 values(p_scope,auth.uid(),'resolved',p_operation,p_snapshot) returning * into prior;
 insert into private.assistance_resolution_current(scope_id,history_id,resolved)
 values(p_scope,prior.id,true);
 result:=jsonb_build_object('id',p_scope,'outcome','resolved','resolved_at',prior.recorded_at);
 return private.save_assistance_receipt(p_operation,'resolve',args,result);
end $$;

create function private.complete_and_resolve_assistance(p_scope uuid,p_commitment uuid,p_material_revision bigint,p_snapshot text,p_operation uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare s private.prompting_scopes; req private.assistance_requests; c private.assistance_commitments;
 r jsonb; done private.assistance_completion_reports; resolved private.assistance_resolution_history;
 args jsonb; receipt jsonb; result jsonb;
begin
 perform private.lock_participation_arrangement(p_scope);
 select * into s from private.prompting_scopes where id=p_scope for update;
 select * into req from private.assistance_requests where scope_id=p_scope for update;
 select * into c from private.assistance_commitments where scope_id=p_scope for update;
 perform public.check_private_session(); r:=private.involvement(p_scope,auth.uid());
 if s.id is null or req.scope_id is null or r is null or r->'practical'<>'true' or r->'resolve'<>'true' or
    r->>'preset' not in ('helper','coordinator') then
  raise sqlstate 'PT403' using message='Current completion and need-resolution authority is required.';
 end if;
 if c.scope_id is null or c.operation is distinct from p_commitment then
  raise sqlstate 'PT409' using message='This responsibility changed. Review current details.';
 end if;
 if c.performer is distinct from auth.uid() then
  raise sqlstate 'PT403' using message='Only the accepted performer can combine their completion and need resolution.';
 end if;
 args:=jsonb_build_object('scope',p_scope,'commitment',p_commitment,'revision',p_material_revision,'snapshot',p_snapshot);
 receipt:=private.assistance_receipt(p_operation,'complete-and-resolve',args);
 if receipt is not null then return receipt; end if;
 if exists(select 1 from private.assistance_resolution_current where scope_id=p_scope and resolved) then
  raise sqlstate 'PT409' using message='This need is already resolved. Review current details.';
 end if;
 if exists(select 1 from private.assistance_completion_reports where commitment_operation=c.operation) then
  raise sqlstate 'PT409' using message='Completion was already reported. Resolve the need separately.';
 end if;
 if req.material_revision is distinct from p_material_revision or p_snapshot is null or
    private.assistance_resolution_snapshot(p_scope) is distinct from p_snapshot then
  raise sqlstate 'PT409' using message='This need or responsibility changed. Review current details.';
 end if;
 insert into private.assistance_completion_reports(commitment_operation,scope_id,performer,reporter,material_revision,operation)
 values(c.operation,p_scope,c.performer,auth.uid(),req.material_revision,p_operation) returning * into done;
 insert into private.assistance_resolution_history(scope_id,actor,action,operation,target_snapshot)
 values(p_scope,auth.uid(),'resolved',p_operation,p_snapshot) returning * into resolved;
 insert into private.assistance_resolution_current(scope_id,history_id,resolved)
 values(p_scope,resolved.id,true);
 result:=jsonb_build_object('id',p_scope,'outcome','completed-and-resolved','reported_at',done.reported_at,'resolved_at',resolved.recorded_at);
 return private.save_assistance_receipt(p_operation,'complete-and-resolve',args,result);
end $$;
revoke all on function private.resolve_assistance(uuid,text,uuid),
 private.complete_and_resolve_assistance(uuid,uuid,bigint,text,uuid) from public,anon,authenticated;
grant execute on function private.resolve_assistance(uuid,text,uuid),
 private.complete_and_resolve_assistance(uuid,uuid,bigint,text,uuid) to authenticated;
create function public.resolve_assistance(p_scope uuid,p_snapshot text,p_operation uuid) returns jsonb
language sql security invoker set search_path='' as $$ select private.resolve_assistance(p_scope,p_snapshot,p_operation); $$;
create function public.complete_and_resolve_assistance(p_scope uuid,p_commitment uuid,p_material_revision bigint,p_snapshot text,p_operation uuid)
returns jsonb language sql security invoker set search_path='' as $$
 select private.complete_and_resolve_assistance(p_scope,p_commitment,p_material_revision,p_snapshot,p_operation);
$$;
revoke all on function public.resolve_assistance(uuid,text,uuid),
 public.complete_and_resolve_assistance(uuid,uuid,bigint,text,uuid) from public,anon;
grant execute on function public.resolve_assistance(uuid,text,uuid),
 public.complete_and_resolve_assistance(uuid,uuid,bigint,text,uuid) to authenticated;

-- Keep the previous checked operations private, and put a resolution guard at their existing public names.
alter function private.create_assistance_request(uuid,text,text,text,text,text,text,bigint,uuid) rename to create_assistance_request_before_resolution;
alter function private.offer_assistance(uuid,uuid,bigint,uuid) rename to offer_assistance_before_resolution;
alter function private.accept_assistance(uuid,bigint,uuid) rename to accept_assistance_before_resolution;
alter function private.answer_assistance(uuid,text,bigint,uuid) rename to answer_assistance_before_resolution;
revoke all on function private.create_assistance_request_before_resolution(uuid,text,text,text,text,text,text,bigint,uuid),
 private.offer_assistance_before_resolution(uuid,uuid,bigint,uuid),
 private.accept_assistance_before_resolution(uuid,bigint,uuid),
 private.answer_assistance_before_resolution(uuid,text,bigint,uuid) from public,anon,authenticated;

create function private.create_assistance_request(p_scope uuid,p_task text,p_place text,p_instructions text,
 p_date text,p_time text,p_zone text,p_revision bigint,p_operation uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare s private.prompting_scopes; r jsonb; args jsonb; receipt jsonb;
begin
 perform private.lock_participation_arrangement(p_scope);
 select * into s from private.prompting_scopes where id=p_scope for update;
 perform public.check_private_session(); r:=private.involvement(p_scope,auth.uid());
 if s.id is null or r is null or r->>'preset'<>'coordinator' or r->'practical'<>'true' then
  raise sqlstate 'PT403' using message='Current coordination scope is required.';
 end if;
 if exists(select 1 from private.assistance_resolution_current where scope_id=p_scope and resolved) then
  args:=jsonb_build_object('scope',p_scope,'task',p_task,'place',p_place,'instructions',p_instructions,'date',p_date,'time',p_time,'zone',p_zone,'revision',p_revision);
  receipt:=private.assistance_receipt(p_operation,'create-request',args);
  if receipt is not null then return receipt; end if;
  raise sqlstate 'PT409' using message='This need is resolved. Review current details.';
 end if;
 return private.create_assistance_request_before_resolution(p_scope,p_task,p_place,p_instructions,p_date,p_time,p_zone,p_revision,p_operation);
end $$;

create function private.offer_assistance(p_scope uuid,p_user uuid,p_material_revision bigint,p_operation uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare s private.prompting_scopes; req private.assistance_requests; r jsonb; target jsonb; args jsonb; receipt jsonb;
begin
 perform private.lock_participation_arrangement(p_scope);
 select * into s from private.prompting_scopes where id=p_scope for update;
 select * into req from private.assistance_requests where scope_id=p_scope for update;
 perform public.check_private_session(); r:=private.involvement(p_scope,auth.uid()); target:=private.involvement(p_scope,p_user);
 if req.scope_id is null or r is null or r->>'preset'<>'coordinator' or r->'practical'<>'true' or r->'disclose'<>'true' then
  raise sqlstate 'PT403' using message='Current coordination and disclosure authority are required.';
 end if;
 if p_user is null or p_user=auth.uid() or exists(select 1 from private.prompting_participants where scope_id=p_scope and user_id=p_user and removed_at is not null) or
    exists(select 1 from private.scope_involvement where scope_id=p_scope and user_id=p_user and blocked) or
    (target is not null and target->'practical'<>'true') then
  raise sqlstate 'PT403' using message='This Helper is unavailable with current access.';
 end if;
 if exists(select 1 from private.assistance_resolution_current where scope_id=p_scope and resolved) then
  args:=jsonb_build_object('scope',p_scope,'user',p_user,'revision',p_material_revision);
  receipt:=private.assistance_receipt(p_operation,'offer',args);
  if receipt is not null then return receipt; end if;
  raise sqlstate 'PT409' using message='This need is resolved. New offers are unavailable.';
 end if;
 return private.offer_assistance_before_resolution(p_scope,p_user,p_material_revision,p_operation);
end $$;

create function private.accept_assistance(p_scope uuid,p_material_revision bigint,p_operation uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare s private.prompting_scopes; req private.assistance_requests; r jsonb; args jsonb; receipt jsonb;
begin
 perform private.lock_participation_arrangement(p_scope);
 select * into s from private.prompting_scopes where id=p_scope for update;
 select * into req from private.assistance_requests where scope_id=p_scope for update;
 perform public.check_private_session(); r:=private.involvement(p_scope,auth.uid());
 if req.scope_id is null or not s.shareable or r is null or r->'practical'<>'true' or r->>'preset' not in ('helper','coordinator') or
    not exists(select 1 from private.assistance_audience where scope_id=p_scope and user_id=auth.uid()) then
  raise sqlstate 'PT403' using message='This opportunity is unavailable with current authorization.';
 end if;
 if exists(select 1 from private.assistance_resolution_current where scope_id=p_scope and resolved) then
  args:=jsonb_build_object('scope',p_scope,'revision',p_material_revision);
  receipt:=private.assistance_receipt(p_operation,'accept',args);
  if receipt is not null then return receipt; end if;
  raise sqlstate 'PT409' using message='This need is resolved. New acceptance is unavailable.';
 end if;
 return private.accept_assistance_before_resolution(p_scope,p_material_revision,p_operation);
end $$;

create function private.answer_assistance(p_scope uuid,p_answer text,p_material_revision bigint,p_operation uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare s private.prompting_scopes; req private.assistance_requests; r jsonb; args jsonb; receipt jsonb;
begin
 perform private.lock_participation_arrangement(p_scope);
 select * into s from private.prompting_scopes where id=p_scope for update;
 select * into req from private.assistance_requests where scope_id=p_scope for update;
 perform public.check_private_session(); r:=private.involvement(p_scope,auth.uid());
 if req.scope_id is null or not s.shareable or r is null or r->'practical'<>'true' or
    not exists(select 1 from private.assistance_audience where scope_id=p_scope and user_id=auth.uid()) then
  raise sqlstate 'PT403' using message='This request is unavailable.';
 end if;
 if exists(select 1 from private.assistance_resolution_current where scope_id=p_scope and resolved) then
  args:=jsonb_build_object('scope',p_scope,'answer',p_answer,'revision',p_material_revision);
  receipt:=private.assistance_receipt(p_operation,'answer',args);
  if receipt is not null then return receipt; end if;
  raise sqlstate 'PT409' using message='This need is resolved. New responses are unavailable.';
 end if;
 return private.answer_assistance_before_resolution(p_scope,p_answer,p_material_revision,p_operation);
end $$;
revoke all on function private.create_assistance_request(uuid,text,text,text,text,text,text,bigint,uuid),
 private.offer_assistance(uuid,uuid,bigint,uuid),private.accept_assistance(uuid,bigint,uuid),
 private.answer_assistance(uuid,text,bigint,uuid) from public,anon,authenticated;
grant execute on function private.create_assistance_request(uuid,text,text,text,text,text,text,bigint,uuid),
 private.offer_assistance(uuid,uuid,bigint,uuid),private.accept_assistance(uuid,bigint,uuid),
 private.answer_assistance(uuid,text,bigint,uuid) to authenticated;

-- Add resolution only to the currently authorized practical projection.
create or replace function private.read_assistance(p_scope uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare s private.prompting_scopes; req private.assistance_requests; r jsonb; commitment private.assistance_commitments;
 completed private.assistance_completion_reports; resolution private.assistance_resolution_history;
 eligible boolean; coordinator boolean; result jsonb; performer_label text; resolver_label text; cross_need boolean;
begin
 select * into s from private.prompting_scopes where id=p_scope for share;
 perform public.check_private_session(); r:=private.involvement(p_scope,auth.uid());
 if s.id is null or r is null or r->'practical'<>'true' then raise sqlstate 'PT403' using message='This need is unavailable.'; end if;
 coordinator:=r->>'preset'='coordinator';
 cross_need:=exists(select 1 from private.coordination_authorizations where arrangement_id=s.arrangement_id and author=auth.uid());
 select * into req from private.assistance_requests where scope_id=p_scope;
 eligible:=exists(select 1 from private.assistance_audience where scope_id=p_scope and user_id=auth.uid());
 select * into commitment from private.assistance_commitments where scope_id=p_scope;
 if req.scope_id is null and not coordinator then raise sqlstate 'PT403' using message='This need is unavailable.'; end if;
 if req.scope_id is not null and not coordinator and not eligible and commitment.performer is distinct from auth.uid() then raise sqlstate 'PT403' using message='This opportunity is unavailable.'; end if;
 if commitment.scope_id is not null then
  select * into completed from private.assistance_completion_reports where commitment_operation=commitment.operation;
 end if;
 select h.* into resolution from private.assistance_resolution_current current_state
 join private.assistance_resolution_history h on h.id=current_state.history_id
 where current_state.scope_id=p_scope and current_state.resolved;
 if resolution.id is not null then
  select coalesce(m.label,i.recipient,case when resolution.actor=s.permission_author then s.inviter_label end)
  into resolver_label from private.prompting_scopes q
  left join private.scope_involvement m on m.scope_id=q.id and m.user_id=resolution.actor
  left join private.prompting_participants p on p.scope_id=q.id and p.user_id=resolution.actor
  left join private.invitations i on i.id=p.invitation_id
  where q.id=p_scope;
 end if;
 if coordinator and commitment.scope_id is not null then
  select coalesce(m.label,i.recipient) into performer_label
  from private.assistance_commitments c
  left join private.scope_involvement m on m.scope_id=c.scope_id and m.user_id=c.performer
  left join private.prompting_participants p on p.scope_id=c.scope_id and p.user_id=c.performer
  left join private.invitations i on i.id=p.invitation_id
  where c.scope_id=p_scope;
 end if;
 result:=jsonb_build_object('id',s.id,'arrangement_id',s.arrangement_id,'older_adult',s.summary->>'olderAdult',
  'task',s.summary->>'description','place',s.summary->>'location','instructions',coalesce(req.instructions,''),
  'scheduled_at',req.scheduled_at,'schedule_zone',req.schedule_zone,'local_date',req.local_date,'local_time',req.local_time,
  'material_revision',req.material_revision,'scope_revision',s.revision,'created',req.scope_id is not null,
  'coordinator',coordinator,'can_create_other',coordinator and s.id=s.arrangement_id and cross_need,
  'can_offer',coordinator and r->'disclose'='true' and req.scope_id is not null and commitment.scope_id is null and resolution.id is null,
  'can_resolve',r->'resolve'='true','resolved',resolution.id is not null,'resolved_at',resolution.recorded_at,
  'resolved_by',resolver_label,'resolution_snapshot',private.assistance_resolution_snapshot(p_scope),
  'eligible',eligible,'accepted_by_me',commitment.performer=auth.uid(),'arranged',commitment.scope_id is not null,
  'accepted_at',commitment.accepted_at,'accepted_by',performer_label,
  'commitment_id',case when commitment.performer=auth.uid() then commitment.operation else null end,
  'completion_reported_at',completed.reported_at,
  'completion_reported_by_me',completed.reporter=auth.uid(),
  'my_answer',(select answer from private.assistance_responses where scope_id=p_scope and user_id=auth.uid()),
  'audience_count',(select count(*) from private.assistance_audience where scope_id=p_scope));
 if coordinator and r->'disclose'='true' and resolution.id is null then
  result:=result||jsonb_build_object('candidates',private.assistance_candidates(p_scope));
 end if;
 return result;
end $$;
notify pgrst, 'reload schema';
