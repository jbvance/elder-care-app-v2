-- Make the committed performer recognizable to an authorized Coordinator.
create or replace function private.read_assistance(p_scope uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare s private.prompting_scopes; req private.assistance_requests; r jsonb; commitment private.assistance_commitments;
 eligible boolean; coordinator boolean; result jsonb; performer_label text;
begin
 select * into s from private.prompting_scopes where id=p_scope for share;
 perform public.check_private_session(); r:=private.involvement(p_scope,auth.uid());
 if s.id is null or r is null or r->'practical'<>'true' then raise sqlstate 'PT403' using message='This need is unavailable.'; end if;
 coordinator:=r->>'preset'='coordinator';
 select * into req from private.assistance_requests where scope_id=p_scope;
 eligible:=exists(select 1 from private.assistance_audience where scope_id=p_scope and user_id=auth.uid());
 select * into commitment from private.assistance_commitments where scope_id=p_scope;
 if req.scope_id is null and (not coordinator or s.id<>s.arrangement_id) then raise sqlstate 'PT403' using message='This need is unavailable.'; end if;
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
  'coordinator',coordinator,'can_create_other',coordinator and s.id=s.arrangement_id,
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

-- Keep the established transactional update, without an unused scope-row variable.
create or replace function private.update_assistance_request(p_scope uuid,p_task text,p_place text,p_instructions text,
 p_date text,p_time text,p_zone text,p_material_revision bigint,p_operation uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare req private.assistance_requests; r jsonb; instant timestamptz; args jsonb; receipt jsonb; result jsonb;
begin
 perform private.lock_participation_arrangement(p_scope);
 perform 1 from private.prompting_scopes where id=p_scope for update;
 select * into req from private.assistance_requests where scope_id=p_scope for update;
 perform public.check_private_session(); r:=private.involvement(p_scope,auth.uid());
 if req.scope_id is null or r is null or r->>'preset'<>'coordinator' or r->'practical'<>'true' then raise sqlstate 'PT403' using message='Current coordination scope is required.'; end if;
 args:=jsonb_build_object('scope',p_scope,'task',p_task,'place',p_place,'instructions',p_instructions,'date',p_date,'time',p_time,'zone',p_zone,'revision',p_material_revision);
 receipt:=private.assistance_receipt(p_operation,'update-request',args);
 if receipt is not null then return receipt; end if;
 if req.material_revision is distinct from p_material_revision then raise sqlstate 'PT409' using message='Need details changed. Reopen them before saving.'; end if;
 if exists(select 1 from private.assistance_commitments where scope_id=p_scope) then raise sqlstate 'PT409' using message='Accepted work cannot be changed here. Arrange an explicit change later.'; end if;
 if coalesce(btrim(p_task),'')='' or length(p_task)>8000 or p_place is null or length(p_place)>8000 or p_instructions is null or length(p_instructions)>8000 then raise sqlstate 'PT400' using message='Add a brief task and optional practical details.'; end if;
 instant:=private.assistance_instant(p_date,p_time,p_zone);
 if instant is null then p_date:=''; p_time:=''; p_zone:=''; end if;
 perform set_config('private.assistance_schedule_write','on',true);
 update private.prompting_scopes set summary=summary||jsonb_build_object('description',btrim(p_task),'location',p_place,'date',p_date,'time',p_time,'timeZone',p_zone),revision=revision+1 where id=p_scope;
 update private.assistance_requests set instructions=p_instructions,scheduled_at=instant,schedule_zone=nullif(p_zone,''),local_date=p_date,local_time=p_time,material_revision=material_revision+1 where scope_id=p_scope;
 perform set_config('private.assistance_schedule_write','off',true);
 result:=jsonb_build_object('id',p_scope,'updated',true);
 return private.save_assistance_receipt(p_operation,'update-request',args,result);
end $$;
notify pgrst, 'reload schema';
