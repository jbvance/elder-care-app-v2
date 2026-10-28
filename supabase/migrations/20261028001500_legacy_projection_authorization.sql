-- Preserved legacy RPCs cannot disclose a practical summary after scoped narrowing.
create or replace function private.prepare_invitation_scope(p_scope uuid,p_kind text,p_source text,p_delegation boolean)
returns jsonb language plpgsql security definer set search_path='' as $$
declare d jsonb; s private.prompting_scopes;
begin
 perform public.check_private_session();
 select draft into d from public.private_arrangements where id=p_scope and owner_id=auth.uid() for update;
 perform public.check_private_session();
 if d is null or p_kind is null or p_kind not in ('direct','reported') or coalesce(btrim(p_source),'')='' or length(p_source)>254 or p_delegation is distinct from true then
 raise sqlstate 'PT403' using message='Record applicable permission and delegation first.'; end if;
 if p_kind='direct' then p_source:='Signed-in older adult, own statement'; end if;
 insert into private.prompting_scopes(id,arrangement_id,summary,permission_kind,permission_author,permission_source,inviter_label)
 values(p_scope,p_scope,jsonb_build_object('olderAdult',d->>'olderAdult','description',d->>'description','location',d->>'location','date',d->>'date','time',d->>'time','timeZone',d->>'timeZone'),p_kind,auth.uid(),btrim(p_source),(select email from auth.users where id=auth.uid())) on conflict(id) do nothing;
 select * into s from private.prompting_scopes where id=p_scope;
 if s.permission_kind<>p_kind or s.permission_source<>btrim(p_source) then raise sqlstate 'PT409' using message='Permission already recorded. Reopen it.'; end if;
 if private.involvement(p_scope,auth.uid())->'practical' is distinct from 'true'::jsonb then raise sqlstate 'PT403' using message='This scope is unavailable.'; end if;
 return jsonb_build_object('id',s.id,'summary',s.summary);
end $$;
create or replace function private.list_invitation_scope(p_scope uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare s private.prompting_scopes;
begin
 perform public.check_private_session();
 select * into s from private.prompting_scopes where id=p_scope and permission_author=auth.uid() for share;
 perform public.check_private_session();
 if private.involvement(p_scope,auth.uid())->'practical' is distinct from 'true'::jsonb or s.id is null or private.involvement(p_scope,auth.uid())->'manage' is distinct from 'true'::jsonb then return null; end if;
 return jsonb_build_object('id',s.id,'summary',s.summary,'permission_kind',s.permission_kind,'permission_source',s.permission_source,'recorded_at',s.recorded_at,'authority_active',s.authority_active,'shareable',s.shareable,
 'invitations',coalesce((select jsonb_agg(jsonb_build_object('id',id,'recipient',recipient,'state',state,'expires_at',expires_at)) from private.invitations where scope_id=p_scope),'[]'::jsonb),
 'participants',coalesce((select jsonb_agg(jsonb_build_object('user_id',p.user_id,'label',i.recipient,'removed',p.removed_at is not null)) from private.prompting_participants p join private.invitations i on i.id=p.invitation_id and i.scope_id=p.scope_id where p.scope_id=p_scope),'[]'::jsonb));
end $$;
notify pgrst, 'reload schema';
