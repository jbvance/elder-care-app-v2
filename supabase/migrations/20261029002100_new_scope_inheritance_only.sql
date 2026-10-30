-- A previously prepared need is existing content. Establishing an ongoing future
-- audience must not expose that need when its request is recorded later.
create or replace function private.create_assistance_request(p_scope uuid,p_task text,p_place text,p_instructions text,
 p_date text,p_time text,p_zone text,p_revision bigint,p_operation uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare s private.prompting_scopes; r jsonb; instant timestamptz; args jsonb; receipt jsonb; result jsonb;
begin
 perform private.lock_participation_arrangement(p_scope);
 select * into s from private.prompting_scopes where id=p_scope for update;
 perform public.check_private_session(); r:=private.involvement(p_scope,auth.uid());
 if r is null or r->>'preset'<>'coordinator' or r->'practical'<>'true' then raise sqlstate 'PT403' using message='Current coordination scope is required.'; end if;
 args:=jsonb_build_object('scope',p_scope,'task',p_task,'place',p_place,'instructions',p_instructions,'date',p_date,'time',p_time,'zone',p_zone,'revision',p_revision);
 receipt:=private.assistance_receipt(p_operation,'create-request',args);
 if receipt is not null then return receipt; end if;
 if s.revision is distinct from p_revision or exists(select 1 from private.assistance_requests where scope_id=p_scope) then raise sqlstate 'PT409' using message='This need changed. Reopen it.'; end if;
 if coalesce(btrim(p_task),'')='' or length(p_task)>8000 or p_place is null or length(p_place)>8000 or p_instructions is null or length(p_instructions)>8000 then raise sqlstate 'PT400' using message='Add a brief task and optional practical details.'; end if;
 instant:=private.assistance_instant(p_date,p_time,p_zone);
 if instant is null then p_date:=''; p_time:=''; p_zone:=''; end if;
 update private.prompting_scopes set summary=summary||jsonb_build_object('description',btrim(p_task),'location',p_place,'date',p_date,'time',p_time,'timeZone',p_zone),revision=revision+1 where id=p_scope;
 insert into private.assistance_requests(scope_id,instructions,scheduled_at,schedule_zone,local_date,local_time,created_by)
 values(p_scope,p_instructions,instant,nullif(p_zone,''),p_date,p_time,auth.uid());
 result:=jsonb_build_object('id',p_scope,'created',true);
 return private.save_assistance_receipt(p_operation,'create-request',args,result);
end $$;
notify pgrst, 'reload schema';
