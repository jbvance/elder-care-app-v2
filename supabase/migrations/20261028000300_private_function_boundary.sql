-- Preserve applied migration history; retain the existing public RPC contract.
create function private.associate_private_draft(p_operation_id uuid, p_draft jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  result public.private_arrangements;
  field text;
begin
  perform public.check_private_session();
  if p_operation_id is null or p_draft is null or jsonb_typeof(p_draft) <> 'object'
     or (select count(*) from jsonb_object_keys(p_draft)) <> 7
     or p_draft->'prepared' is distinct from 'true'::jsonb then
    raise sqlstate 'PT400' using message = 'Finish preparing this draft first.';
  end if;
  foreach field in array array['olderAdult','description','location','date','time','timeZone'] loop
    if jsonb_typeof(p_draft->field) is distinct from 'string' or length(p_draft->>field) > 8000 then
      raise sqlstate 'PT400' using message = 'Invalid private draft.';
    end if;
  end loop;
  -- Seven fields are present in the native draft (six strings and prepared).
  if btrim(p_draft->>'olderAdult') = '' or btrim(p_draft->>'description') = '' then
    raise sqlstate 'PT400' using message = 'Add a name and assistance need.';
  end if;
  insert into public.private_arrangements(owner_id, operation_id, draft)
    values(auth.uid(), p_operation_id, p_draft)
    on conflict(owner_id, operation_id) do nothing;
  select * into strict result from public.private_arrangements
    where owner_id = auth.uid() and operation_id = p_operation_id;
  if result.draft is distinct from p_draft then
    raise sqlstate 'PT409' using message = 'This draft was already saved with different contents. Reopen the saved arrangement.';
  end if;
  return to_jsonb(result);
end;
$$;
revoke all on function private.associate_private_draft(uuid,jsonb) from public, anon, authenticated;
grant execute on function private.associate_private_draft(uuid,jsonb) to authenticated;

-- The exposed RPCs run as the caller; privileged bodies remain non-exposed.
alter function public.check_private_session() security invoker;
create or replace function public.associate_private_draft(p_operation_id uuid, p_draft jsonb)
returns jsonb language sql security invoker set search_path = '' as $$
  select private.associate_private_draft(p_operation_id, p_draft);
$$;
revoke all on function public.associate_private_draft(uuid,jsonb) from public, anon;
grant execute on function public.associate_private_draft(uuid,jsonb) to authenticated;
notify pgrst, 'reload schema';
