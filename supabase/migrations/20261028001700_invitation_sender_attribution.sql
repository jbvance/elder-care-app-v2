-- Attribute delegated invitations to the authorized sender, not the scope author.
alter table private.invitations add column inviter_label text;
create function private.invitation_actor_label(p_scope uuid,p_user uuid) returns text
language sql stable security definer set search_path='' as $$
 select coalesce(m.label,i.recipient,case when s.permission_author=p_user then s.inviter_label end,'Authorized participant')
 from private.prompting_scopes s
 left join private.scope_involvement m on m.scope_id=s.id and m.user_id=p_user
 left join private.prompting_participants p on p.scope_id=s.id and p.user_id=p_user
 left join private.invitations i on i.id=p.invitation_id where s.id=p_scope;
$$;
revoke all on function private.invitation_actor_label(uuid,uuid) from public,anon,authenticated;
-- Existing labels come only from recorded invitation/participation context.
update private.invitations i set inviter_label=private.invitation_actor_label(i.scope_id,i.inviter);
alter table private.invitations alter column inviter_label set not null;
create function private.record_invitation_sender() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 new.inviter_label:=private.invitation_actor_label(new.scope_id,new.inviter);
 return new;
end $$;
revoke all on function private.record_invitation_sender() from public,anon,authenticated;
create trigger invitation_sender before insert on private.invitations
for each row execute function private.record_invitation_sender();
create or replace function private.read_prompting_summary(p_scope uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare s private.prompting_scopes;
begin
 perform public.check_private_session();
 select * into s from private.prompting_scopes where id=p_scope for share;
 perform public.check_private_session();
 if private.involvement(p_scope,auth.uid())->'practical' is distinct from 'true'::jsonb then raise sqlstate 'PT403' using message='This request is unavailable.'; end if;
 return jsonb_build_object('id',s.id,'summary',s.summary,'inviter',coalesce((select i.inviter_label from private.prompting_participants p join private.invitations i on i.id=p.invitation_id where p.scope_id=s.id and p.user_id=auth.uid()),s.inviter_label),'recorded_at',s.recorded_at);
end $$;
create or replace function private.read_scope_context(p_scope uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare s private.prompting_scopes; r jsonb; result jsonb;
begin
 select * into s from private.prompting_scopes where id=p_scope for share;
 perform public.check_private_session(); r:=private.involvement(p_scope,auth.uid());
 if r is null then raise sqlstate 'PT403' using message='This scope is unavailable.'; end if;
 result:=jsonb_build_object('id',s.id,'arrangement_id',s.arrangement_id,'revision',s.revision,'rights',r);
 if r->'practical'='true' then result:=result||jsonb_build_object('summary',s.summary,'inviter',coalesce((select i.inviter_label from private.prompting_participants p join private.invitations i on i.id=p.invitation_id where p.scope_id=s.id and p.user_id=auth.uid()),s.inviter_label),'recorded_at',s.recorded_at); end if;
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
 result:=result||jsonb_build_object('can_invite',coalesce(private.may_invite(p_scope,auth.uid()),false),'invitation_sender',case when private.may_invite(p_scope,auth.uid()) then private.invitation_actor_label(p_scope,auth.uid()) end);
 if r->>'preset'='coordinator' and r->'practical'='true' then
 result:=result||jsonb_build_object('practical_audience',coalesce((select jsonb_agg(jsonb_build_object('user_id',x.user_id,'label',x.label,'included',private.involvement(s.id,x.user_id)->'practical')) from (
 select p.user_id,coalesce(m.label,i.recipient) as label from private.prompting_participants p join private.invitations i on i.id=p.invitation_id
 left join private.scope_involvement m on m.scope_id=p.scope_id and m.user_id=p.user_id where p.scope_id=s.id
 union select m.user_id,m.label from private.scope_involvement m where m.scope_id=s.id and not exists(select 1 from private.prompting_participants p where p.scope_id=s.id and p.user_id=m.user_id)
 ) x where private.involvement(s.id,x.user_id) is not null),'[]'::jsonb));
 end if;
 return result;
end $$;
notify pgrst, 'reload schema';
