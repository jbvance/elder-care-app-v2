-- Avoid a PL/pgSQL variable/column name collision in the combined operation.
create or replace function private.complete_and_resolve_assistance(p_scope uuid,p_commitment uuid,p_material_revision bigint,p_snapshot text,p_operation uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare s private.prompting_scopes; req private.assistance_requests; c private.assistance_commitments;
 r jsonb; done private.assistance_completion_reports; resolution_event private.assistance_resolution_history;
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
 values(p_scope,auth.uid(),'resolved',p_operation,p_snapshot) returning * into resolution_event;
 insert into private.assistance_resolution_current(scope_id,history_id,resolved)
 values(p_scope,resolution_event.id,true);
 result:=jsonb_build_object('id',p_scope,'outcome','completed-and-resolved','reported_at',done.reported_at,'resolved_at',resolution_event.recorded_at);
 return private.save_assistance_receipt(p_operation,'complete-and-resolve',args,result);
end $$;
