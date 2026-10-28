-- Serialize cross-need eligibility with restrictions using the existing arrangement row.
create function private.lock_participation_arrangement(p_scope uuid) returns void language plpgsql security definer set search_path='' as $$
begin
 perform 1 from public.private_arrangements where id=(select arrangement_id from private.prompting_scopes where id=p_scope) for update;
end $$;
revoke all on function private.lock_participation_arrangement(uuid) from public,anon,authenticated;
create or replace function private.change_involvement(p_scope uuid,p_user uuid,p_rights jsonb,p_remove boolean,p_kind text,p_source text,p_revision bigint,p_operation uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare s private.prompting_scopes; actor_rights jsonb; previous jsonb; k text; h private.participation_history; args jsonb; label text;
begin
 perform private.lock_participation_arrangement(p_scope);
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
 if not coalesce(private.may_invite(p_scope,p_user),false) then update private.invitations set state='revoked' where scope_id=p_scope and inviter=p_user and state='pending'; end if;
 update private.prompting_scopes set revision=revision+1 where id=p_scope;
 insert into private.participation_history(scope_id,actor,operation,action,input,before_state,after_state) values(p_scope,auth.uid(),p_operation,'involvement',args,previous,jsonb_build_object('rights',p_rights,'removed',p_remove,'kind',p_kind,'source',case when p_kind='direct' then 'Signed-in older adult, own statement' else btrim(p_source) end));
 -- Removing oneself succeeds but returns no protected context.
 if p_remove and p_user=auth.uid() then return null; end if;
 return private.read_scope_context(p_scope);
end $$;
create or replace function private.add_practical_audience(p_scope uuid,p_user uuid,p_revision bigint,p_operation uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare s private.prompting_scopes; r jsonb; label text; h private.participation_history; args jsonb;
begin
 perform private.lock_participation_arrangement(p_scope);
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
create or replace function private.add_coordination_scope(p_parent uuid,p_description text,p_revision bigint,p_operation uuid) returns uuid
language plpgsql security definer set search_path='' as $$
declare s private.prompting_scopes; r jsonb; h private.participation_history; result uuid;
begin
 perform private.lock_participation_arrangement(p_parent);
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
create or replace function private.join_invitation(p_token text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare i private.invitations; s private.prompting_scopes; email text; confirmed timestamptz; removed timestamptz;
begin
 perform public.check_private_session();
 select * into i from private.invitations where token_hash=encode(extensions.digest(p_token,'sha256'),'hex');
 if not found then raise sqlstate 'PT403' using message='This invitation is unavailable. Sign in with the intended address or ask for a new invitation.'; end if;
 perform private.lock_participation_arrangement(i.scope_id);
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
 if i.state<>'pending' or clock_timestamp()>=i.expires_at or not coalesce(private.may_invite(s.id,i.inviter),false) then raise sqlstate 'PT403' using message='This invitation is unavailable. Sign in with the intended address or ask for a new invitation.'; end if;
 insert into private.prompting_participants(scope_id,user_id,invitation_id) values(s.id,auth.uid(),i.id) on conflict(scope_id,user_id) do nothing;
 update private.invitations set state='joined',joined_by=auth.uid(),joined_at=clock_timestamp() where id=i.id;
 return private.read_prompting_summary(s.id);
end $$;
create or replace function private.manage_invitation_scope(p_scope uuid,p_action text,p_target uuid default null) returns boolean
language plpgsql security definer set search_path='' as $$
declare s private.prompting_scopes;
begin
 perform private.lock_participation_arrangement(p_scope);
 perform public.check_private_session();
 select * into s from private.prompting_scopes where id=p_scope for update;
 perform public.check_private_session();
 if s.permission_author<>auth.uid() or private.involvement(p_scope,auth.uid())->'manage' is distinct from 'true'::jsonb then raise sqlstate 'PT403' using message='Current participation-management authority is required.'; end if;
 if p_action='remove' then
 insert into private.scope_involvement(scope_id,user_id,label,rights,blocked)
 select p_scope,p_target,coalesce(m.label,i.recipient,case when p_target=s.permission_author then s.inviter_label end),coalesce(m.rights,private.helper_rights()),true
 from private.prompting_scopes q left join private.scope_involvement m on m.scope_id=q.id and m.user_id=p_target
 left join private.prompting_participants p on p.scope_id=q.id and p.user_id=p_target left join private.invitations i on i.id=p.invitation_id
 where q.id=p_scope and (m.user_id is not null or p.user_id is not null or p_target=s.permission_author)
 on conflict(scope_id,user_id) do update set blocked=true;
 update private.invitations set state='revoked' where scope_id=p_scope and inviter=p_target and state='pending';
 update private.prompting_participants set removed_at=coalesce(removed_at,clock_timestamp()) where scope_id=p_scope and user_id=p_target;
 elsif p_action='revoke' then
 update private.invitations set state='revoked' where scope_id=p_scope and id=p_target and state='pending';
 elsif p_action in ('withdraw','end-authority') then
 update private.prompting_scopes set shareable=case when p_action='withdraw' then false else shareable end,authority_active=false where id=p_scope;
 update private.invitations set state='revoked' where scope_id=p_scope and state='pending' and (p_action='withdraw' or inviter=auth.uid());
 else raise sqlstate 'PT400' using message='Unknown action.'; end if;
 update private.prompting_scopes set revision=revision+1 where id=p_scope;
 return true;
end $$;
notify pgrst, 'reload schema';
