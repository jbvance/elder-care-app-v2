-- Ticket 05 review correction: an offer cannot silently restore narrowed practical access.
create or replace function private.offer_assistance(p_scope uuid,p_user uuid,p_material_revision bigint,p_operation uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare s private.prompting_scopes; req private.assistance_requests; r jsonb; target jsonb; label text; args jsonb; receipt jsonb; result jsonb; cross_need boolean;
begin
 perform private.lock_participation_arrangement(p_scope);
 select * into s from private.prompting_scopes where id=p_scope for update;
 select * into req from private.assistance_requests where scope_id=p_scope for update;
 perform public.check_private_session(); r:=private.involvement(p_scope,auth.uid()); target:=private.involvement(p_scope,p_user);
 if req.scope_id is null or r is null or r->>'preset'<>'coordinator' or r->'practical'<>'true' or r->'disclose'<>'true' then raise sqlstate 'PT403' using message='Current coordination and disclosure authority are required.'; end if;
 if p_user is null or p_user=auth.uid() or exists(select 1 from private.prompting_participants where scope_id=p_scope and user_id=p_user and removed_at is not null) or
    exists(select 1 from private.scope_involvement where scope_id=p_scope and user_id=p_user and blocked) then raise sqlstate 'PT403' using message='This Helper is unavailable.'; end if;
 if target is not null and target->'practical'<>'true' then raise sqlstate 'PT403' using message='Restore this Helper''s practical access before offering the need.'; end if;
 args:=jsonb_build_object('scope',p_scope,'user',p_user,'revision',p_material_revision);
 receipt:=private.assistance_receipt(p_operation,'offer',args);
 if receipt is not null then return receipt; end if;
 if req.material_revision is distinct from p_material_revision then raise sqlstate 'PT409' using message='Opportunity changed. Reopen it.'; end if;
 if exists(select 1 from private.assistance_commitments where scope_id=p_scope) then raise sqlstate 'PT409' using message='This work is already arranged.'; end if;
 cross_need:=exists(select 1 from private.coordination_authorizations where arrangement_id=s.arrangement_id and author=auth.uid());
 if target is not null then
  select coalesce(m.label,i.recipient,case when p_user=s.permission_author then s.inviter_label end) into label
  from private.prompting_scopes q
  left join private.scope_involvement m on m.scope_id=q.id and m.user_id=p_user
  left join private.prompting_participants p on p.scope_id=q.id and p.user_id=p_user
  left join private.invitations i on i.id=p.invitation_id
  where q.id=p_scope;
 else
  if not cross_need then raise sqlstate 'PT403' using message='Recorded arrangement disclosure authority is required for another need.'; end if;
  select coalesce(m.label,i.recipient) into label from private.prompting_scopes q
  left join private.scope_involvement m on m.scope_id=q.id and m.user_id=p_user
  left join private.prompting_participants p on p.scope_id=q.id and p.user_id=p_user
  left join private.invitations i on i.id=p.invitation_id
  where q.arrangement_id=s.arrangement_id and private.involvement(q.id,p_user)->'practical'='true' limit 1;
 end if;
 if label is null then raise sqlstate 'PT403' using message='Invite an eligible Helper into this authorized scope first.'; end if;
 if target is null then
  insert into private.scope_involvement(scope_id,user_id,label,rights) values(p_scope,p_user,label,private.helper_rights());
 end if;
 insert into private.assistance_audience(scope_id,user_id,added_by) values(p_scope,p_user,auth.uid()) on conflict(scope_id,user_id) do nothing;
 delete from private.assistance_responses where scope_id=p_scope and user_id=p_user;
 update private.assistance_requests set material_revision=material_revision+1 where scope_id=p_scope;
 update private.prompting_scopes set revision=revision+1 where id=p_scope;
 result:=jsonb_build_object('offered',true);
 return private.save_assistance_receipt(p_operation,'offer',args,result);
end $$;
notify pgrst, 'reload schema';
