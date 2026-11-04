-- Match direct resolution eligibility to the current practical read boundary before any receipt.
create or replace function private.resolve_assistance(p_scope uuid,p_snapshot text,p_operation uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare s private.prompting_scopes; req private.assistance_requests; commitment private.assistance_commitments;
 r jsonb; prior private.assistance_resolution_history; eligible boolean; coordinator boolean;
 args jsonb; receipt jsonb; result jsonb;
begin
 perform private.lock_participation_arrangement(p_scope);
 select * into s from private.prompting_scopes where id=p_scope for update;
 perform public.check_private_session(); r:=private.involvement(p_scope,auth.uid());
 if s.id is null or r is null or r->'practical'<>'true' or r->'resolve'<>'true' then
  raise sqlstate 'PT403' using message='Current need-resolution authority is required.';
 end if;
 coordinator:=r->>'preset'='coordinator';
 select * into req from private.assistance_requests where scope_id=p_scope;
 eligible:=exists(select 1 from private.assistance_audience where scope_id=p_scope and user_id=auth.uid());
 select * into commitment from private.assistance_commitments where scope_id=p_scope;
 if req.scope_id is null and not coordinator then
  raise sqlstate 'PT403' using message='This need is unavailable.';
 end if;
 if req.scope_id is not null and not coordinator and not eligible and commitment.performer is distinct from auth.uid() then
  raise sqlstate 'PT403' using message='This opportunity is unavailable.';
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
