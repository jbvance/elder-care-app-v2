-- Ticket 06: an attributable report about one accepted assistance commitment.
-- Need resolution and offline submission are separate later slices.
create table private.assistance_completion_reports (
 commitment_operation uuid primary key references private.assistance_commitments(operation),
 scope_id uuid not null references private.assistance_requests(scope_id),
 performer uuid not null references auth.users(id),
 reporter uuid not null references auth.users(id),
 material_revision bigint not null,
 reported_at timestamptz not null default clock_timestamp(),
 operation uuid not null unique,
 check (performer = reporter)
);
create index assistance_completion_reports_scope_idx on private.assistance_completion_reports(scope_id);
revoke all on private.assistance_completion_reports from public,anon,authenticated;

create function private.report_assistance_completion(p_scope uuid,p_commitment uuid,p_material_revision bigint,p_operation uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare s private.prompting_scopes; req private.assistance_requests; c private.assistance_commitments;
 r jsonb; prior private.assistance_completion_reports; args jsonb; receipt jsonb; result jsonb;
begin
 perform private.lock_participation_arrangement(p_scope);
 select * into s from private.prompting_scopes where id=p_scope for update;
 select * into req from private.assistance_requests where scope_id=p_scope for update;
 perform public.check_private_session(); r:=private.involvement(p_scope,auth.uid());
 if s.id is null or req.scope_id is null or r is null or r->'practical'<>'true' or
    r->>'preset' not in ('helper','coordinator') then
  raise sqlstate 'PT403' using message='Current access to this responsibility is required.';
 end if;
 select * into c from private.assistance_commitments where scope_id=p_scope for update;
 if c.scope_id is null or c.operation is distinct from p_commitment then
  raise sqlstate 'PT409' using message='This responsibility changed. Review current details before reporting.';
 end if;
 if c.performer is distinct from auth.uid() then
  raise sqlstate 'PT403' using message='Only the accepted performer can report their own assistance complete.';
 end if;
 args:=jsonb_build_object('scope',p_scope,'commitment',p_commitment,'revision',p_material_revision);
 receipt:=private.assistance_receipt(p_operation,'complete',args);
 if receipt is not null then return receipt; end if;
 select * into prior from private.assistance_completion_reports where commitment_operation=c.operation;
 if found then
  result:=jsonb_build_object('outcome','reported','scope',p_scope,'reported_at',prior.reported_at);
  return private.save_assistance_receipt(p_operation,'complete',args,result);
 end if;
 if req.material_revision is distinct from p_material_revision then
  raise sqlstate 'PT409' using message='Responsibility details changed. Review current details before reporting.';
 end if;
 insert into private.assistance_completion_reports(commitment_operation,scope_id,performer,reporter,material_revision,operation)
 values(c.operation,p_scope,c.performer,auth.uid(),req.material_revision,p_operation)
 returning * into prior;
 result:=jsonb_build_object('outcome','reported','scope',p_scope,'reported_at',prior.reported_at);
 return private.save_assistance_receipt(p_operation,'complete',args,result);
end $$;
revoke all on function private.report_assistance_completion(uuid,uuid,bigint,uuid) from public,anon,authenticated;
grant execute on function private.report_assistance_completion(uuid,uuid,bigint,uuid) to authenticated;
create function public.report_assistance_completion(p_scope uuid,p_commitment uuid,p_material_revision bigint,p_operation uuid)
returns jsonb language sql security invoker set search_path='' as $$
 select private.report_assistance_completion(p_scope,p_commitment,p_material_revision,p_operation);
$$;
revoke all on function public.report_assistance_completion(uuid,uuid,bigint,uuid) from public,anon;
grant execute on function public.report_assistance_completion(uuid,uuid,bigint,uuid) to authenticated;

-- Extend the existing practical projection without loading restricted background.
create or replace function private.read_assistance(p_scope uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare s private.prompting_scopes; req private.assistance_requests; r jsonb; commitment private.assistance_commitments;
 completed private.assistance_completion_reports; eligible boolean; coordinator boolean; result jsonb; performer_label text; cross_need boolean;
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
 if commitment.scope_id is not null then
  select * into completed from private.assistance_completion_reports where commitment_operation=commitment.operation;
 end if;
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
  'commitment_id',case when commitment.performer=auth.uid() then commitment.operation else null end,
  'completion_reported_at',completed.reported_at,
  'completion_reported_by_me',completed.reporter=auth.uid(),
  'my_answer',(select answer from private.assistance_responses where scope_id=p_scope and user_id=auth.uid()),
  'audience_count',(select count(*) from private.assistance_audience where scope_id=p_scope));
 if coordinator and r->'disclose'='true' then
  result:=result||jsonb_build_object('candidates',private.assistance_candidates(p_scope));
 end if;
 return result;
end $$;
notify pgrst, 'reload schema';
