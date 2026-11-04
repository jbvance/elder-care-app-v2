-- Remove an unused locked-row variable from the Ticket 07 offer guard.
create or replace function private.offer_assistance(p_scope uuid,p_user uuid,p_material_revision bigint,p_operation uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare req private.assistance_requests; r jsonb; target jsonb; args jsonb; receipt jsonb;
begin
 perform private.lock_participation_arrangement(p_scope);
 perform 1 from private.prompting_scopes where id=p_scope for update;
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
