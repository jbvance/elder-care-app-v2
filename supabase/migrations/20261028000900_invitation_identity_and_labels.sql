-- Preserve applied history: stable joined identity and invitation-context participant labels.
create or replace function private.join_invitation(p_token text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare i private.invitations; s private.prompting_scopes; email text; confirmed timestamptz; removed timestamptz;
begin
 perform public.check_private_session();
 select * into i from private.invitations where token_hash=encode(extensions.digest(p_token,'sha256'),'hex');
 if not found then raise sqlstate 'PT403' using message='This invitation is unavailable. Sign in with the intended address or ask for a new invitation.'; end if;
 select * into s from private.prompting_scopes where id=i.scope_id for update;
 perform public.check_private_session();
 select * into i from private.invitations where id=i.id for update;
 perform public.check_private_session();
 select lower(btrim(u.email)),u.email_confirmed_at into email,confirmed from auth.users u where u.id=auth.uid() for share;
 perform public.check_private_session();
 select removed_at into removed from private.prompting_participants where scope_id=s.id and user_id=auth.uid();
 if not s.shareable or removed is not null then raise sqlstate 'PT403' using message='This invitation is unavailable. Sign in with the intended address or ask for a new invitation.'; end if;
 if i.state='joined' then
 if i.joined_by<>auth.uid() or not exists(select 1 from private.prompting_participants where scope_id=s.id and user_id=auth.uid() and removed_at is null) then raise sqlstate 'PT403' using message='This invitation is unavailable. Sign in with the intended address or ask for a new invitation.'; end if;
 return private.read_prompting_summary(s.id); end if;
 -- Recipient email binds only the initial grant. Consumed retries follow joined_by.
 if confirmed is null or email is distinct from i.recipient then raise sqlstate 'PT403' using message='This invitation is unavailable. Sign in with the intended address or ask for a new invitation.'; end if;
 if i.state<>'pending' or clock_timestamp()>=i.expires_at or not s.authority_active or i.inviter<>s.permission_author then raise sqlstate 'PT403' using message='This invitation is unavailable. Sign in with the intended address or ask for a new invitation.'; end if;
 insert into private.prompting_participants(scope_id,user_id,invitation_id) values(s.id,auth.uid(),i.id) on conflict(scope_id,user_id) do nothing;
 update private.invitations set state='joined',joined_by=auth.uid(),joined_at=clock_timestamp() where id=i.id;
 return private.read_prompting_summary(s.id);
end $$;
create or replace function private.list_invitation_scope(p_scope uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare s private.prompting_scopes;
begin
 perform public.check_private_session();
 select * into s from private.prompting_scopes where id=p_scope and permission_author=auth.uid() for share;
 perform public.check_private_session();
 if s.id is null then return null; end if;
 return jsonb_build_object('id',s.id,'summary',s.summary,'permission_kind',s.permission_kind,'permission_source',s.permission_source,'recorded_at',s.recorded_at,'authority_active',s.authority_active,'shareable',s.shareable,
 'invitations',coalesce((select jsonb_agg(jsonb_build_object('id',id,'recipient',recipient,'state',state,'expires_at',expires_at)) from private.invitations where scope_id=p_scope),'[]'::jsonb),
 'participants',coalesce((select jsonb_agg(jsonb_build_object('user_id',p.user_id,'label',i.recipient,'removed',p.removed_at is not null)) from private.prompting_participants p join private.invitations i on i.id=p.invitation_id and i.scope_id=p.scope_id where p.scope_id=p_scope),'[]'::jsonb));
end $$;
notify pgrst, 'reload schema';
