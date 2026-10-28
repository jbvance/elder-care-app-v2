-- Derive contextual candidates from both joined and explicitly scoped participation.
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
 if r->>'preset'='coordinator' and r->'disclose'='true' and exists(select 1 from private.coordination_authorizations where arrangement_id=s.arrangement_id and author=auth.uid()) then
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
 end if;
 return result;
end $$;
notify pgrst, 'reload schema';
