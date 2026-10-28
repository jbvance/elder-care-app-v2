-- Practical audience decisions are independent of participation-management delegation.
create function private.set_practical_audience(p_scope uuid,p_user uuid,p_include boolean,p_revision bigint,p_operation uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare s private.prompting_scopes; actor_rights jsonb; previous jsonb; next_rights jsonb;
 h private.participation_history; args jsonb; recipient_label text;
begin
 perform private.lock_participation_arrangement(p_scope);
 select * into s from private.prompting_scopes where id=p_scope for update;
 perform public.check_private_session();
 actor_rights:=private.involvement(p_scope,auth.uid()); previous:=private.involvement(p_scope,p_user);
 if actor_rights is null or actor_rights->>'preset'<>'coordinator' or actor_rights->'practical'<>'true' then
  raise sqlstate 'PT403' using message='Current coordination scope and practical access are required.';
 end if;
 args:=jsonb_build_object('user',p_user,'include',p_include,'revision',p_revision);
 select * into h from private.participation_history where actor=auth.uid() and operation=p_operation;
 if found then
  if h.scope_id<>p_scope or h.action<>'practical-audience' or h.input<>args then raise sqlstate 'PT409' using message='Operation already used with different contents.'; end if;
  return private.read_scope_context(p_scope);
 end if;
 if p_operation is null or p_include is null then raise sqlstate 'PT400' using message='Select an audience change.'; end if;
 if s.revision is distinct from p_revision then raise sqlstate 'PT409' using message='Audience changed. Reopen it before trying again.'; end if;
 if previous is null then raise sqlstate 'PT403' using message='This participant is not currently eligible in this scope.'; end if;
 if p_include and previous->'practical'='false' and actor_rights->'disclose'<>'true' then
  raise sqlstate 'PT403' using message='Broadening practical access requires disclosure authority.';
 end if;
 select coalesce(m.label,i.recipient,case when p_user=s.permission_author then s.inviter_label end) into recipient_label
 from private.prompting_scopes q
 left join private.scope_involvement m on m.scope_id=q.id and m.user_id=p_user
 left join private.prompting_participants p on p.scope_id=q.id and p.user_id=p_user
 left join private.invitations i on i.id=p.invitation_id where q.id=p_scope;
 if recipient_label is null then raise sqlstate 'PT403' using message='This audience entry is unavailable.'; end if;
 next_rights:=previous||jsonb_build_object('practical',p_include);
 insert into private.scope_involvement(scope_id,user_id,label,rights) values(p_scope,p_user,recipient_label,next_rights)
 on conflict(scope_id,user_id) do update set rights=excluded.rights;
 if not coalesce(private.may_invite(p_scope,p_user),false) then
  update private.invitations set state='revoked' where scope_id=p_scope and inviter=p_user and state='pending';
 end if;
 update private.prompting_scopes set revision=revision+1 where id=p_scope;
 insert into private.participation_history(scope_id,actor,operation,action,input,before_state,after_state)
 values(p_scope,auth.uid(),p_operation,'practical-audience',args,previous,next_rights);
 -- Self-narrowing returns only the remaining authorized projection.
 return private.read_scope_context(p_scope);
end $$;
revoke all on function private.set_practical_audience(uuid,uuid,boolean,bigint,uuid) from public,anon,authenticated;
grant execute on function private.set_practical_audience(uuid,uuid,boolean,bigint,uuid) to authenticated;
create function public.set_practical_audience(p_scope uuid,p_user uuid,p_include boolean,p_revision bigint,p_operation uuid)
returns jsonb language sql security invoker set search_path='' as $$
 select private.set_practical_audience(p_scope,p_user,p_include,p_revision,p_operation);
$$;
revoke all on function public.set_practical_audience(uuid,uuid,boolean,bigint,uuid) from public,anon;
grant execute on function public.set_practical_audience(uuid,uuid,boolean,bigint,uuid) to authenticated;

create or replace function private.read_scope_context(p_scope uuid) returns jsonb
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
 if r->>'preset'='coordinator' and r->'practical'='true' and r->'disclose'='true' and exists(select 1 from private.coordination_authorizations where arrangement_id=s.arrangement_id and author=auth.uid()) then
 result:=result||jsonb_build_object('candidates',coalesce((select jsonb_agg(c) from (
 select distinct x.user_id,x.label from private.prompting_scopes q cross join lateral (
 select m.user_id,m.label from private.scope_involvement m where m.scope_id=q.id
 union select p.user_id,i.recipient from private.prompting_participants p join private.invitations i on i.id=p.invitation_id where p.scope_id=q.id
 ) x
 where q.arrangement_id=s.arrangement_id and q.id<>s.id and private.involvement(q.id,x.user_id)->'practical'='true'
 and not exists(select 1 from private.scope_involvement own where own.scope_id=s.id and own.user_id=x.user_id)
 and not exists(select 1 from private.prompting_participants own where own.scope_id=s.id and own.user_id=x.user_id)
 ) c),'[]'::jsonb));
 end if;
 result:=result||jsonb_build_object('can_invite',coalesce(private.may_invite(p_scope,auth.uid()),false));
 if r->>'preset'='coordinator' and r->'practical'='true' then
 result:=result||jsonb_build_object('practical_audience',coalesce((select jsonb_agg(jsonb_build_object('user_id',x.user_id,'label',x.label,'included',private.involvement(s.id,x.user_id)->'practical')) from (
 select p.user_id,coalesce(m.label,i.recipient) as label from private.prompting_participants p join private.invitations i on i.id=p.invitation_id
 left join private.scope_involvement m on m.scope_id=p.scope_id and m.user_id=p.user_id where p.scope_id=s.id
 union select m.user_id,m.label from private.scope_involvement m where m.scope_id=s.id and not exists(select 1 from private.prompting_participants p where p.scope_id=s.id and p.user_id=m.user_id)
 ) x where private.involvement(s.id,x.user_id) is not null),'[]'::jsonb));
 end if;
 return result;
end $$;
create or replace function private.add_practical_audience(p_scope uuid,p_user uuid,p_revision bigint,p_operation uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare s private.prompting_scopes; r jsonb; label text; h private.participation_history; args jsonb;
begin
 perform private.lock_participation_arrangement(p_scope);
 select * into s from private.prompting_scopes where id=p_scope for update;
 perform public.check_private_session(); r:=private.involvement(p_scope,auth.uid());
 if r is null or r->>'preset'<>'coordinator' or r->'practical'<>'true' or r->'disclose'<>'true' or not exists(select 1 from private.coordination_authorizations where arrangement_id=s.arrangement_id and author=auth.uid()) then raise sqlstate 'PT403' using message='Applicable coordination and disclosure authority are required.'; end if;
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
notify pgrst, 'reload schema';
