-- Ticket 05 independent-review correction: cross-need disclosure follows the
-- recorded arrangement authorization already required by ticket 04.
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
   and not exists(select 1 from private.prompting_participants blocked where blocked.scope_id=p_scope and blocked.user_id=q.user_id and blocked.removed_at is not null)
   and not exists(select 1 from private.scope_involvement blocked where blocked.scope_id=p_scope and blocked.user_id=q.user_id and blocked.blocked)
 ) x),'[]'::jsonb);
end $$;

create or replace function private.set_ongoing_helper_audience(p_root uuid,p_user uuid,p_include boolean,p_revision bigint,p_operation uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare s private.prompting_scopes; r jsonb; target jsonb; args jsonb; receipt jsonb; result jsonb;
begin
 perform private.lock_participation_arrangement(p_root);
 select * into s from private.prompting_scopes where id=p_root for update;
 perform public.check_private_session(); r:=private.involvement(p_root,auth.uid()); target:=private.involvement(p_root,p_user);
 if s.id is null or s.id<>s.arrangement_id or r is null or r->>'preset'<>'coordinator' or r->'practical'<>'true' or r->'disclose'<>'true' or
    not exists(select 1 from private.coordination_authorizations where arrangement_id=s.arrangement_id and author=auth.uid()) then
  raise sqlstate 'PT403' using message='Recorded arrangement coordination and disclosure authority are required.';
 end if;
 args:=jsonb_build_object('root',p_root,'user',p_user,'include',p_include,'revision',p_revision);
 receipt:=private.assistance_receipt(p_operation,'ongoing-audience',args);
 if receipt is not null then return receipt; end if;
 if s.revision is distinct from p_revision then raise sqlstate 'PT409' using message='Audience changed. Reopen it.'; end if;
 if p_include is null or p_user=auth.uid() or (p_include and (target is null or target->>'preset'<>'helper' or target->'practical'<>'true')) then raise sqlstate 'PT403' using message='Select an eligible authorized Helper.'; end if;
 if p_include then
  insert into private.ongoing_helper_audience(arrangement_id,user_id,authorized_by) values(p_root,p_user,auth.uid()) on conflict(arrangement_id,user_id) do nothing;
 else
  delete from private.ongoing_helper_audience where arrangement_id=p_root and user_id=p_user;
 end if;
 update private.prompting_scopes set revision=revision+1 where id=p_root;
 result:=jsonb_build_object('ongoing',p_include);
 return private.save_assistance_receipt(p_operation,'ongoing-audience',args,result);
end $$;

create or replace function private.offer_assistance(p_scope uuid,p_user uuid,p_material_revision bigint,p_operation uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare s private.prompting_scopes; req private.assistance_requests; r jsonb; target jsonb; label text; args jsonb; receipt jsonb; result jsonb; cross_need boolean;
begin
 perform private.lock_participation_arrangement(p_scope);
 select * into s from private.prompting_scopes where id=p_scope for update;
 select * into req from private.assistance_requests where scope_id=p_scope for update;
 perform public.check_private_session(); r:=private.involvement(p_scope,auth.uid()); target:=private.involvement(p_scope,p_user);
 if req.scope_id is null or r is null or r->>'preset'<>'coordinator' or r->'practical'<>'true' or r->'disclose'<>'true' then raise sqlstate 'PT403' using message='Current coordination and disclosure authority are required.'; end if;
 args:=jsonb_build_object('scope',p_scope,'user',p_user,'revision',p_material_revision);
 receipt:=private.assistance_receipt(p_operation,'offer',args);
 if receipt is not null then return receipt; end if;
 if req.material_revision is distinct from p_material_revision then raise sqlstate 'PT409' using message='Opportunity changed. Reopen it.'; end if;
 if exists(select 1 from private.assistance_commitments where scope_id=p_scope) then raise sqlstate 'PT409' using message='This work is already arranged.'; end if;
 if p_user is null or p_user=auth.uid() or exists(select 1 from private.prompting_participants where scope_id=p_scope and user_id=p_user and removed_at is not null) or
    exists(select 1 from private.scope_involvement where scope_id=p_scope and user_id=p_user and blocked) then raise sqlstate 'PT403' using message='This Helper is unavailable.'; end if;
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
 elsif target->'practical'<>'true' then
  insert into private.scope_involvement(scope_id,user_id,label,rights) values(p_scope,p_user,label,target||'{"practical":true}'::jsonb)
  on conflict(scope_id,user_id) do update set rights=excluded.rights;
 end if;
 insert into private.assistance_audience(scope_id,user_id,added_by) values(p_scope,p_user,auth.uid()) on conflict(scope_id,user_id) do nothing;
 delete from private.assistance_responses where scope_id=p_scope and user_id=p_user;
 update private.assistance_requests set material_revision=material_revision+1 where scope_id=p_scope;
 update private.prompting_scopes set revision=revision+1 where id=p_scope;
 result:=jsonb_build_object('offered',true);
 return private.save_assistance_receipt(p_operation,'offer',args,result);
end $$;

-- Creating a sibling need is also cross-need coordination. Match the ticket 04
-- additional-scope rule; a future delegated ongoing-creation grant needs review.
create or replace function private.create_assistance_need(p_root uuid,p_task text,p_place text,p_instructions text,
 p_date text,p_time text,p_zone text,p_revision bigint,p_operation uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare root_scope private.prompting_scopes; r jsonb; instant timestamptz; args jsonb; receipt jsonb; new_scope uuid; result jsonb;
begin
 perform private.lock_participation_arrangement(p_root);
 select * into root_scope from private.prompting_scopes where id=p_root for update;
 perform public.check_private_session(); r:=private.involvement(p_root,auth.uid());
 if root_scope.id is null or root_scope.id<>root_scope.arrangement_id or r is null or r->>'preset'<>'coordinator' or r->'practical'<>'true' or
    not exists(select 1 from private.coordination_authorizations where arrangement_id=root_scope.arrangement_id and author=auth.uid()) then
  raise sqlstate 'PT403' using message='Recorded arrangement coordination scope is required to create another need.';
 end if;
 args:=jsonb_build_object('root',p_root,'task',p_task,'place',p_place,'instructions',p_instructions,'date',p_date,'time',p_time,'zone',p_zone,'revision',p_revision);
 receipt:=private.assistance_receipt(p_operation,'create-need',args);
 if receipt is not null then return receipt; end if;
 if root_scope.revision is distinct from p_revision then raise sqlstate 'PT409' using message='Coordination context changed. Reopen it.'; end if;
 if coalesce(btrim(p_task),'')='' or length(p_task)>8000 or p_place is null or length(p_place)>8000 or p_instructions is null or length(p_instructions)>8000 then raise sqlstate 'PT400' using message='Add a brief task and optional practical details.'; end if;
 instant:=private.assistance_instant(p_date,p_time,p_zone);
 if instant is null then p_date:=''; p_time:=''; p_zone:=''; end if;
 new_scope:=gen_random_uuid();
 insert into private.prompting_scopes(id,arrangement_id,summary,permission_kind,permission_author,permission_source,inviter_label)
 values(new_scope,p_root,root_scope.summary||jsonb_build_object('description',btrim(p_task),'location',p_place,'date',p_date,'time',p_time,'timeZone',p_zone),
 root_scope.permission_kind,auth.uid(),root_scope.permission_source,root_scope.inviter_label);
 insert into private.scope_involvement(scope_id,user_id,label,rights) values(new_scope,auth.uid(),root_scope.inviter_label,r);
 insert into private.assistance_requests(scope_id,instructions,scheduled_at,schedule_zone,local_date,local_time,created_by)
 values(new_scope,p_instructions,instant,nullif(p_zone,''),p_date,p_time,auth.uid());
 perform private.inherit_assistance_audience(new_scope,p_root);
 result:=jsonb_build_object('id',new_scope,'created',true);
 return private.save_assistance_receipt(p_operation,'create-need',args,result);
end $$;

-- A previously prepared need belongs in its own Coordinator's ordinary list.
create or replace function private.read_assistance(p_scope uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare s private.prompting_scopes; req private.assistance_requests; r jsonb; commitment private.assistance_commitments;
 eligible boolean; coordinator boolean; result jsonb; performer_label text; cross_need boolean;
begin
 select * into s from private.prompting_scopes where id=p_scope for share;
 perform public.check_private_session(); r:=private.involvement(p_scope,auth.uid());
 if s.id is null or r is null or r->'practical'<>'true' then raise sqlstate 'PT403' using message='This need is unavailable.'; end if;
 coordinator:=r->>'preset'='coordinator';
 cross_need:=exists(select 1 from private.coordination_authorizations where arrangement_id=s.arrangement_id and author=auth.uid());
 select * into req from private.assistance_requests where scope_id=p_scope;
 eligible:=exists(select 1 from private.assistance_audience where scope_id=p_scope and user_id=auth.uid());
 select * into commitment from private.assistance_commitments where scope_id=p_scope;
 if req.scope_id is null and not coordinator then raise sqlstate 'PT403' using message='This need is unavailable.'; end if;
 if req.scope_id is not null and not coordinator and not eligible and commitment.performer is distinct from auth.uid() then raise sqlstate 'PT403' using message='This opportunity is unavailable.'; end if;
 if coordinator and commitment.scope_id is not null then
  select coalesce(m.label,i.recipient) into performer_label
  from private.assistance_commitments c
  left join private.scope_involvement m on m.scope_id=c.scope_id and m.user_id=c.performer
  left join private.prompting_participants p on p.scope_id=c.scope_id and p.user_id=c.performer
  left join private.invitations i on i.id=p.invitation_id
  where c.scope_id=p_scope;
 end if;
 result:=jsonb_build_object('id',s.id,'arrangement_id',s.arrangement_id,'older_adult',s.summary->>'olderAdult',
  'task',s.summary->>'description','place',s.summary->>'location','instructions',coalesce(req.instructions,''),
  'scheduled_at',req.scheduled_at,'schedule_zone',req.schedule_zone,'local_date',req.local_date,'local_time',req.local_time,
  'material_revision',req.material_revision,'scope_revision',s.revision,'created',req.scope_id is not null,
  'coordinator',coordinator,'can_create_other',coordinator and s.id=s.arrangement_id and cross_need,
  'can_offer',coordinator and r->'disclose'='true' and req.scope_id is not null and commitment.scope_id is null,
  'eligible',eligible,'accepted_by_me',commitment.performer=auth.uid(),'arranged',commitment.scope_id is not null,
  'accepted_at',commitment.accepted_at,'accepted_by',performer_label,
  'my_answer',(select answer from private.assistance_responses where scope_id=p_scope and user_id=auth.uid()),
  'audience_count',(select count(*) from private.assistance_audience where scope_id=p_scope));
 if coordinator and r->'disclose'='true' then
  result:=result||jsonb_build_object('candidates',private.assistance_candidates(p_scope));
 end if;
 return result;
end $$;

create or replace function private.list_assistance() returns jsonb language plpgsql security definer set search_path='' as $$
begin
 perform public.check_private_session();
 return coalesce((select jsonb_agg(private.read_assistance(s.id)) from private.prompting_scopes s
  where private.involvement(s.id,auth.uid())->'practical'='true' and
   ((private.involvement(s.id,auth.uid())->>'preset'='coordinator') or
    exists(select 1 from private.assistance_requests r where r.scope_id=s.id and
      (exists(select 1 from private.assistance_audience a where a.scope_id=s.id and a.user_id=auth.uid()) or
       exists(select 1 from private.assistance_commitments c where c.scope_id=s.id and c.performer=auth.uid()))))),'[]'::jsonb);
end $$;
notify pgrst, 'reload schema';
