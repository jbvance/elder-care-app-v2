-- Cross-need candidate discovery must respect practical narrowing in the target need.
create or replace function private.assistance_candidates(p_scope uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare s private.prompting_scopes; r jsonb; cross_need boolean;
begin
 select * into s from private.prompting_scopes where id=p_scope for share;
 perform public.check_private_session();
 r:=private.involvement(p_scope,auth.uid());
 if s.id is null or r is null or r->>'preset'<>'coordinator' or r->'practical'<>'true' or r->'disclose'<>'true' then
  raise sqlstate 'PT403' using message='Current coordination and disclosure authority are required.';
 end if;
 cross_need:=exists(select 1 from private.coordination_authorizations
                    where arrangement_id=s.arrangement_id and author=auth.uid());
 return coalesce((select jsonb_agg(x) from (
  select distinct q.user_id,q.label,
   exists(select 1 from private.assistance_audience a where a.scope_id=p_scope and a.user_id=q.user_id) as offered,
   exists(select 1 from private.ongoing_helper_audience o where o.arrangement_id=s.arrangement_id and o.user_id=q.user_id) as ongoing
  from (
   select m.user_id,m.label,m.scope_id from private.scope_involvement m
   union all select p.user_id,i.recipient,p.scope_id from private.prompting_participants p join private.invitations i on i.id=p.invitation_id
  ) q join private.prompting_scopes source_scope on source_scope.id=q.scope_id
  where source_scope.arrangement_id=s.arrangement_id and q.user_id<>auth.uid()
   and (q.scope_id=p_scope or cross_need)
   and private.involvement(q.scope_id,q.user_id)->'practical'='true'
   and (private.involvement(p_scope,q.user_id) is null or private.involvement(p_scope,q.user_id)->'practical'='true')
   and not exists(select 1 from private.prompting_participants blocked where blocked.scope_id=p_scope and blocked.user_id=q.user_id and blocked.removed_at is not null)
   and not exists(select 1 from private.scope_involvement blocked where blocked.scope_id=p_scope and blocked.user_id=q.user_id and blocked.blocked)
 ) x),'[]'::jsonb);
end $$;
notify pgrst, 'reload schema';
