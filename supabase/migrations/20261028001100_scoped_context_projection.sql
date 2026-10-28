-- Complete the contextual audience view and retain restricted-edit attribution privately.
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
 select distinct coalesce(m.user_id,p.user_id) as user_id,coalesce(m.label,i.recipient) as label from private.prompting_scopes q
 left join private.scope_involvement m on m.scope_id=q.id left join private.prompting_participants p on p.scope_id=q.id left join private.invitations i on i.id=p.invitation_id
 where q.arrangement_id=s.arrangement_id and q.id<>s.id and private.involvement(q.id,coalesce(m.user_id,p.user_id))->'practical'='true'
 and not exists(select 1 from private.scope_involvement own where own.scope_id=s.id and own.user_id=coalesce(m.user_id,p.user_id))
 and not exists(select 1 from private.prompting_participants own where own.scope_id=s.id and own.user_id=coalesce(m.user_id,p.user_id))
 ) c),'[]'::jsonb));
 end if;
 end if;
 return result;
end $$;
create or replace function private.write_scope_information(p_scope uuid,p_practical jsonb,p_background text,p_revision bigint,p_operation uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare s private.prompting_scopes; r jsonb; args jsonb; h private.participation_history; k text; old_background text;
begin
 select * into s from private.prompting_scopes where id=p_scope for update;
 perform public.check_private_session(); r:=private.involvement(p_scope,auth.uid());
 if r is null or r->>'preset'<>'coordinator' or r->'practical'<>'true' then raise sqlstate 'PT403' using message='Current coordination scope is required.'; end if;
 args:=jsonb_build_object('practical',p_practical,'background',p_background,'revision',p_revision);
 select * into h from private.participation_history where actor=auth.uid() and operation=p_operation;
 if found then if h.scope_id<>p_scope or h.action<>'information' or h.input<>args then raise sqlstate 'PT409' using message='Operation already used.'; end if; return private.read_scope_context(p_scope); end if;
 if s.revision is distinct from p_revision then raise sqlstate 'PT409' using message='Information changed. Reopen it before trying again.'; end if;
 if p_operation is null or p_practical is null or jsonb_typeof(p_practical)<>'object' or (select count(*) from jsonb_object_keys(p_practical))<>6 then raise sqlstate 'PT400' using message='Invalid practical information.'; end if;
 foreach k in array array['olderAdult','description','location','date','time','timeZone'] loop
 if jsonb_typeof(p_practical->k) is distinct from 'string' or length(p_practical->>k)>8000 then raise sqlstate 'PT400' using message='Invalid practical information.'; end if;
 end loop;
 select content into old_background from private.scope_background where scope_id=p_scope;
 if p_background is not null then
 if r->'background'<>'true' or length(p_background)>8000 then raise sqlstate 'PT403' using message='Restricted information authorization is required.'; end if;
 insert into private.scope_background values(p_scope,p_background) on conflict(scope_id) do update set content=excluded.content;
 end if;
 update private.prompting_scopes set summary=p_practical,revision=revision+1 where id=p_scope;
 insert into private.participation_history(scope_id,actor,operation,action,input,before_state,after_state) values(p_scope,auth.uid(),p_operation,'information',args,jsonb_build_object('summary',s.summary,'background',old_background),jsonb_build_object('summary',p_practical,'background',coalesce(p_background,old_background)));
 return private.read_scope_context(p_scope);
end $$;
notify pgrst, 'reload schema';
