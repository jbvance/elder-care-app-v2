-- The original root Coordinator can choose an already authorized arrangement Helper
-- for a newly created need without first granting that need's practical access.
create function private.assistance_candidates(p_scope uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare s private.prompting_scopes; r jsonb; root_rights jsonb;
begin
 select * into s from private.prompting_scopes where id=p_scope for share;
 perform public.check_private_session();
 r:=private.involvement(p_scope,auth.uid());
 root_rights:=private.involvement(s.arrangement_id,auth.uid());
 if s.id is null or r is null or r->>'preset'<>'coordinator' or r->'practical'<>'true' or r->'disclose'<>'true' then
  raise sqlstate 'PT403' using message='Current coordination and disclosure authority are required.';
 end if;
 return coalesce((select jsonb_agg(x) from (
  select distinct q.user_id,q.label,
   exists(select 1 from private.assistance_audience a where a.scope_id=p_scope and a.user_id=q.user_id) as offered,
   exists(select 1 from private.ongoing_helper_audience o where o.arrangement_id=s.arrangement_id and o.user_id=q.user_id) as ongoing
  from (
   select m.user_id,m.label,m.scope_id from private.scope_involvement m
   union all select p.user_id,i.recipient,p.scope_id from private.prompting_participants p join private.invitations i on i.id=p.invitation_id
  ) q join private.prompting_scopes source_scope on source_scope.id=q.scope_id
  where source_scope.arrangement_id=s.arrangement_id and q.user_id<>auth.uid()
   and (q.scope_id=p_scope or (root_rights->>'preset'='coordinator' and root_rights->'practical'='true'))
   and private.involvement(q.scope_id,q.user_id)->'practical'='true'
   and not exists(select 1 from private.prompting_participants blocked where blocked.scope_id=p_scope and blocked.user_id=q.user_id and blocked.removed_at is not null)
   and not exists(select 1 from private.scope_involvement blocked where blocked.scope_id=p_scope and blocked.user_id=q.user_id and blocked.blocked)
 ) x),'[]'::jsonb);
end $$;
revoke all on function private.assistance_candidates(uuid) from public,anon,authenticated;
grant execute on function private.assistance_candidates(uuid) to authenticated;
create function public.assistance_candidates(p_scope uuid) returns jsonb
language sql security invoker set search_path='' as $$ select private.assistance_candidates(p_scope); $$;
revoke all on function public.assistance_candidates(uuid) from public,anon;
grant execute on function public.assistance_candidates(uuid) to authenticated;
notify pgrst, 'reload schema';
