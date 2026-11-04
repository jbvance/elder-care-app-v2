-- A resolved need's material terms cannot be rewritten through the older edit paths.
alter function private.update_assistance_request(uuid,text,text,text,text,text,text,bigint,uuid)
 rename to update_assistance_request_before_resolution;
revoke all on function private.update_assistance_request_before_resolution(uuid,text,text,text,text,text,text,bigint,uuid)
 from public,anon,authenticated;

create function private.update_assistance_request(p_scope uuid,p_task text,p_place text,p_instructions text,
 p_date text,p_time text,p_zone text,p_material_revision bigint,p_operation uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare req private.assistance_requests; r jsonb; args jsonb; receipt jsonb;
begin
 perform private.lock_participation_arrangement(p_scope);
 perform 1 from private.prompting_scopes where id=p_scope for update;
 select * into req from private.assistance_requests where scope_id=p_scope for update;
 perform public.check_private_session(); r:=private.involvement(p_scope,auth.uid());
 if req.scope_id is null or r is null or r->>'preset'<>'coordinator' or r->'practical'<>'true' then
  raise sqlstate 'PT403' using message='Current coordination scope is required.';
 end if;
 if exists(select 1 from private.assistance_resolution_current where scope_id=p_scope and resolved) then
  args:=jsonb_build_object('scope',p_scope,'task',p_task,'place',p_place,'instructions',p_instructions,'date',p_date,'time',p_time,'zone',p_zone,'revision',p_material_revision);
  receipt:=private.assistance_receipt(p_operation,'update-request',args);
  if receipt is not null then return receipt; end if;
  raise sqlstate 'PT409' using message='This need is resolved. Review its history instead of changing the request.';
 end if;
 return private.update_assistance_request_before_resolution(p_scope,p_task,p_place,p_instructions,p_date,p_time,p_zone,p_material_revision,p_operation);
end $$;
revoke all on function private.update_assistance_request(uuid,text,text,text,text,text,text,bigint,uuid) from public,anon,authenticated;
grant execute on function private.update_assistance_request(uuid,text,text,text,text,text,text,bigint,uuid) to authenticated;

create or replace function private.guard_assistance_summary() returns trigger
language plpgsql security definer set search_path='' as $$
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
 if material_changed and exists(select 1 from private.assistance_resolution_current where scope_id=old.id and resolved) then
  raise sqlstate 'PT409' using message='This need is resolved. Its material history cannot be rewritten here.';
 end if;
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
notify pgrst, 'reload schema';
