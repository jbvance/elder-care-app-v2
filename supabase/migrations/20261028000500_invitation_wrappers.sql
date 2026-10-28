-- Complete the invoker wrappers for privileged bodies in the private schema.
create function public.prepare_invitation_scope(p_scope uuid,p_kind text,p_source text,p_delegation boolean) returns jsonb language sql security invoker set search_path='' as $$ select private.prepare_invitation_scope(p_scope,p_kind,p_source,p_delegation); $$;
revoke all on function private.prepare_invitation_scope(uuid,text,text,boolean) from public,anon,authenticated;
grant execute on function private.prepare_invitation_scope(uuid,text,text,boolean) to authenticated;
revoke all on function public.prepare_invitation_scope(uuid,text,text,boolean) from public,anon;
grant execute on function public.prepare_invitation_scope(uuid,text,text,boolean) to authenticated;
create function public.issue_invitation(p_scope uuid,p_recipient text,p_operation uuid,p_token text) returns uuid language sql security invoker set search_path='' as $$ select private.issue_invitation(p_scope,p_recipient,p_operation,p_token); $$;
revoke all on function private.issue_invitation(uuid,text,uuid,text) from public,anon,authenticated;
grant execute on function private.issue_invitation(uuid,text,uuid,text) to authenticated;
revoke all on function public.issue_invitation(uuid,text,uuid,text) from public,anon;
grant execute on function public.issue_invitation(uuid,text,uuid,text) to authenticated;
notify pgrst, 'reload schema';
